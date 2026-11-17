// RevenueCat wrapper. RevenueCat is the source of truth for Pro: a store
// purchase and a referral reward both show up as the same "pro" entitlement.
//
// Setup (RevenueCat dashboard):
//   - Entitlement: `pro`
//   - Products: briefbuilder_pro_monthly | briefbuilder_pro_annual | briefbuilder_lifetime1,
//     all attached to `pro` and added to the current offering
//   - Public SDK keys in EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
//
// Real purchases need a development or store build. In Expo Go the SDK runs
// in a preview mode with mocked results.

import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

export const PRO_ENTITLEMENT_ID = 'pro';

export type ProductId =
  | 'briefbuilder_pro_monthly'
  | 'briefbuilder_pro_annual'
  | 'briefbuilder_lifetime1';

/** How the user currently has Pro, if at all. */
export type ProPlan = 'free' | 'referral' | 'subscription' | 'lifetime';

// These are RevenueCat's public SDK keys, which are designed to ship in the app.
const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  }) ?? '';

let configured = false;

/** Safe to call often. Returns false when no key is set for this platform. */
export function configurePurchases(): boolean {
  if (configured) return true;
  if (!API_KEY) return false;
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
  return true;
}

function planFrom(info: CustomerInfo): ProPlan {
  const entitlement = info.entitlements.active[PRO_ENTITLEMENT_ID];
  if (!entitlement) return 'free';
  if (entitlement.store === 'PROMOTIONAL') return 'referral';
  if (entitlement.expirationDate === null) return 'lifetime';
  return 'subscription';
}

function isCancelled(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { userCancelled?: boolean }).userCancelled === true;
}

/**
 * RevenueCat's anonymous ID for this install. It is the only identity the
 * app has, and it is what referrals are recorded against.
 */
export async function getAppUserId(): Promise<string | null> {
  if (!configurePurchases()) return null;
  try {
    return await Purchases.getAppUserID();
  } catch (err) {
    console.warn('Could not read RevenueCat app user ID', err);
    return null;
  }
}

/**
 * Current plan, or null when it cannot be determined (no key configured, or
 * offline with nothing cached). Callers should keep the last known value on
 * null. Pass `fresh` to skip the SDK cache, e.g. right after a referral reward.
 */
export async function getProPlan(fresh = false): Promise<ProPlan | null> {
  if (!configurePurchases()) return null;
  try {
    if (fresh) await Purchases.invalidateCustomerInfoCache();
    return planFrom(await Purchases.getCustomerInfo());
  } catch (err) {
    console.warn('Could not read RevenueCat customer info', err);
    return null;
  }
}

export async function checkProStatus(fresh = false): Promise<boolean | null> {
  const plan = await getProPlan(fresh);
  return plan === null ? null : plan !== 'free';
}

/** Calls back whenever RevenueCat reports a change. Returns an unsubscribe function. */
export function onProStatusChange(listener: (isPro: boolean) => void): () => void {
  if (!configurePurchases()) return () => {};
  const handler = (info: CustomerInfo) => listener(planFrom(info) !== 'free');
  Purchases.addCustomerInfoUpdateListener(handler);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(handler);
  };
}

function matchesProduct(pkg: PurchasesPackage, productId: ProductId): boolean {
  // Google Play subscription identifiers look like "product_id:base_plan_id".
  const id = pkg.product.identifier;
  return id === productId || id.startsWith(`${productId}:`);
}

async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configurePurchases()) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Store-localized price strings, keyed by product. Empty if they cannot be loaded. */
export async function getPrices(): Promise<Partial<Record<ProductId, string>>> {
  const prices: Partial<Record<ProductId, string>> = {};
  try {
    const ids: ProductId[] = [
      'briefbuilder_pro_monthly',
      'briefbuilder_pro_annual',
      'briefbuilder_lifetime1',
    ];
    for (const pkg of await getPackages()) {
      const id = ids.find((candidate) => matchesProduct(pkg, candidate));
      if (id) prices[id] = pkg.product.priceString;
    }
  } catch (err) {
    console.warn('Could not load RevenueCat offerings', err);
  }
  return prices;
}

/**
 * Returns true if Pro is now active, false if the user backed out. Throws
 * with a readable message for anything else.
 */
export async function purchasePro(productId: ProductId): Promise<boolean> {
  if (!configurePurchases()) {
    throw new Error('Purchases are not set up in this build.');
  }
  const pkg = (await getPackages()).find((candidate) => matchesProduct(candidate, productId));
  if (!pkg) {
    throw new Error('That plan is not available right now. Try again later.');
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return planFrom(customerInfo) !== 'free';
  } catch (err) {
    if (isCancelled(err)) return false;
    throw new Error(err instanceof Error ? err.message : 'The purchase did not go through.');
  }
}

/** Returns true if a previous purchase was found and Pro is active. */
export async function restorePurchases(): Promise<boolean> {
  if (!configurePurchases()) {
    throw new Error('Purchases are not set up in this build.');
  }
  try {
    return planFrom(await Purchases.restorePurchases()) !== 'free';
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Could not restore purchases.');
  }
}
