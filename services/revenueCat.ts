// TODO: Implement RevenueCat before App Store submission.
// Requires: npx expo install react-native-purchases + EAS Build.
// Product IDs: briefbuilder_pro_monthly | briefbuilder_pro_annual | briefbuilder_lifetime

export type ProductId =
  | 'briefbuilder_pro_monthly'
  | 'briefbuilder_pro_annual'
  | 'briefbuilder_lifetime';

export async function checkProStatus(): Promise<boolean> {
  return false;
}

export async function purchasePro(_productId: ProductId): Promise<boolean> {
  console.warn('RevenueCat not configured. Purchase not processed.');
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  console.warn('RevenueCat not configured. Restore not processed.');
  return false;
}
