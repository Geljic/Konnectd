import { Platform } from 'react-native';
import { MONETISATION_PRODUCTS } from '@/constants/config';

export type MonetisationProductId =
  typeof MONETISATION_PRODUCTS[keyof typeof MONETISATION_PRODUCTS]['id'];

export interface PurchaseResult {
  productId: MonetisationProductId;
  transactionId: string;
}

export async function purchaseProduct(productId: MonetisationProductId): Promise<PurchaseResult> {
  // Native store / RevenueCat integration can replace this function without touching UI state.
  await new Promise(resolve => setTimeout(resolve, Platform.OS === 'web' ? 250 : 650));
  return {
    productId,
    transactionId: `dev_${productId}_${Date.now()}`,
  };
}

export async function restorePurchases(): Promise<MonetisationProductId[]> {
  await new Promise(resolve => setTimeout(resolve, 250));
  return [];
}
