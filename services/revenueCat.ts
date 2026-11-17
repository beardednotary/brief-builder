// RevenueCat wrapper. RevenueCat is the source of truth for Pro: a store
// purchase and a referral reward both show up as the same "pro" entitlement.
//
// Setup (RevenueCat dashboard):
//   - Entitlement: `pro`
//   - Products: briefbuilder_pro_monthly | briefbuilder_pro_annual | briefbuilder_lifetime1,
//     all attached to `pro` and added to the current offering
//   - Public SDK keys in EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
//
// Real purchases need a development or store build. In Expo Go purchases are
// off: the app runs as free and the paywall shows its built-in prices.

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
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

// Expo Go has no native store. The SDK rejects a real store key there, so
// purchases are switched off and the paywall shows its built-in prices.
const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let configured = false;
let unavailable = IN_EXPO_GO || !API_KEY;

/**
 * Safe to call often. Returns false when purchases cannot be used: no key for
 * this platform, running in Expo Go, or the SDK refused to start.
 */
export function configurePurchases(): boolean {
  if (configured) return true;
  if (unavailable) return false;
  try {
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
  } catch (err) {
    // Do not retry: the same key will fail the same way on every call.
    unavailable = true;
    console.warn('RevenueCat could not be configured', err);
  }
  return configured;
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

const PRODUCT_IDS: ProductId[] = [
  'briefbuilder_pro_monthly',
  'briefbuilder_pro_annual',
  'briefbuilder_lifetime1',
];

export interface PlanDetails {
  /** Store-localized price, such as "$14.99". */
  price: string;
  /** For subscriptions, the price spread per month, such as "$1.25". */
  pricePerMonth: string | null;
  /**
   * Length of a free trial this user can actually get, such as "1 week".
   * Null when the product has no free trial or the user is not eligible.
   */
  freeTrial: string | null;
}

function describePeriod(unit: string, count: number): string {
  const name = unit.toLowerCase();
  return count === 1 ? `1 ${name}` : `${count} ${name}s`;
}

/**
 * Free-trial length per product, only where this user is eligible. Apple
 * says a trial must not be shown to someone who cannot get it, so on iOS an
 * unknown eligibility counts as no. Google Play only returns offers the user
 * is eligible for, so there the offer itself is enough.
 */
async function getFreeTrials(
  packages: { id: ProductId; pkg: PurchasesPackage }[]
): Promise<Partial<Record<ProductId, string>>> {
  const withTrial = packages.filter(({ pkg }) => pkg.product.introPrice?.price === 0);
  if (withTrial.length === 0) return {};

  let eligible = (_identifier: string) => Platform.OS === 'android';
  if (Platform.OS === 'ios') {
    const statuses = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      withTrial.map(({ pkg }) => pkg.product.identifier)
    );
    eligible = (identifier) =>
      statuses[identifier]?.status ===
      Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
  }

  const trials: Partial<Record<ProductId, string>> = {};
  for (const { id, pkg } of withTrial) {
    const intro = pkg.product.introPrice;
    if (intro && eligible(pkg.product.identifier)) {
      trials[id] = describePeriod(intro.periodUnit, intro.periodNumberOfUnits * intro.cycles);
    }
  }
  return trials;
}

/**
 * Store-localized price and any free trial the user is eligible for, keyed by
 * product. Empty if they cannot be loaded; callers fall back to list prices.
 */
export async function getPlanDetails(): Promise<Partial<Record<ProductId, PlanDetails>>> {
  const details: Partial<Record<ProductId, PlanDetails>> = {};
  try {
    const packages: { id: ProductId; pkg: PurchasesPackage }[] = [];
    for (const pkg of await getPackages()) {
      const id = PRODUCT_IDS.find((candidate) => matchesProduct(pkg, candidate));
      if (id) packages.push({ id, pkg });
    }

    let trials: Partial<Record<ProductId, string>> = {};
    try {
      trials = await getFreeTrials(packages);
    } catch (err) {
      // If eligibility cannot be checked, show plain prices rather than a
      // trial the user might not get.
      console.warn('Could not check free trial eligibility', err);
    }

    for (const { id, pkg } of packages) {
      details[id] = {
        price: pkg.product.priceString,
        pricePerMonth: pkg.product.pricePerMonthString ?? null,
        freeTrial: trials[id] ?? null,
      };
    }
  } catch (err) {
    console.warn('Could not load RevenueCat offerings', err);
  }
  return details;
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
