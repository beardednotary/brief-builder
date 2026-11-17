import { useEffect, useRef } from 'react';
import { useProfile } from './useProfile';
import { checkProStatus, onProStatusChange } from '../services/revenueCat';
import { getReferralStatus } from '../services/referrals';
import * as storage from '../services/storage';

/**
 * Keeps profile.isPro in step with RevenueCat, which is the source of truth
 * for purchases and referral rewards alike. Mount once, inside the tabs.
 */
export function useProSync(): void {
  const { profile, saveProfile } = useProfile();
  const hasProfile = profile !== null;
  const isProRef = useRef(profile?.isPro);
  isProRef.current = profile?.isPro;

  useEffect(() => {
    if (!hasProfile) return;
    let active = true;

    // null means RevenueCat could not say (no key, or offline with no cache),
    // so the last known value stands.
    const apply = (isPro: boolean | null) => {
      if (!active || isPro === null || isProRef.current === isPro) return;
      saveProfile({ isPro });
    };

    (async () => {
      let isPro = await checkProStatus();

      // Referral months earned while subscribed are banked. If Pro has lapsed,
      // checking in with the ledger starts them.
      if (isPro === false && (await storage.hasJoinedReferrals())) {
        try {
          const status = await getReferralStatus();
          if (status.justGranted > 0) isPro = await checkProStatus(true);
        } catch {
          // Offline or not set up. Try again next launch.
        }
      }
      apply(isPro);
    })();

    const unsubscribe = onProStatusChange(apply);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [hasProfile, saveProfile]);
}
