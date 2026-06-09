import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  purchaseProduct,
  restorePurchases,
  type MonetisationProductId,
} from '@/api/monetisation';
import { MONETISATION_PRODUCTS } from '@/constants/config';

const STORAGE_KEY = 'monetisation_owned_products';

interface MonetisationState {
  ownedProductIds: MonetisationProductId[];
  loaded: boolean;
  purchasingProductId: MonetisationProductId | null;

  load: () => Promise<void>;
  buyProduct: (productId: MonetisationProductId) => Promise<void>;
  restore: () => Promise<void>;
  ownsProduct: (productId: MonetisationProductId) => boolean;
  isCosmeticPackOwned: () => boolean;
  isSupporter: () => boolean;
}

function uniqueProducts(productIds: MonetisationProductId[]) {
  return Array.from(new Set(productIds));
}

async function persist(productIds: MonetisationProductId[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
}

export const useMonetisationStore = create<MonetisationState>((set, get) => ({
  ownedProductIds: [],
  loaded: false,
  purchasingProductId: null,

  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const productIds = raw ? JSON.parse(raw) as MonetisationProductId[] : [];
      set({ ownedProductIds: uniqueProducts(productIds), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  async buyProduct(productId) {
    set({ purchasingProductId: productId });
    try {
      const result = await purchaseProduct(productId);
      const ownedProductIds = uniqueProducts([...get().ownedProductIds, result.productId]);
      set({ ownedProductIds });
      await persist(ownedProductIds);
    } finally {
      set({ purchasingProductId: null });
    }
  },

  async restore() {
    set({ purchasingProductId: 'konnectd_support_pass' });
    try {
      const restored = await restorePurchases();
      const ownedProductIds = uniqueProducts([...get().ownedProductIds, ...restored]);
      set({ ownedProductIds });
      await persist(ownedProductIds);
    } finally {
      set({ purchasingProductId: null });
    }
  },

  ownsProduct(productId) {
    return get().ownedProductIds.includes(productId);
  },

  isCosmeticPackOwned() {
    const owned = get().ownedProductIds;
    return owned.includes(MONETISATION_PRODUCTS.cosmeticsPack.id) ||
      owned.includes(MONETISATION_PRODUCTS.supportPass.id);
  },

  isSupporter() {
    return get().ownedProductIds.includes(MONETISATION_PRODUCTS.supportPass.id);
  },
}));
