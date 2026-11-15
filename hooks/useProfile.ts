import { useState, useEffect, useCallback } from 'react';
import { UserProfile, AirmanRank, Component } from '../types';
import * as storage from '../services/storage';

// Module-level singleton — all hook instances share state and stay in sync.
let _profile: UserProfile | null = null;
let _loaded = false;
let _loading = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

const DEFAULT_PROFILE: UserProfile = {
  rank: 'SrA' as AirmanRank,
  afsc: '',
  component: 'RegAF' as Component,
  isPro: false,
};

export function useProfile() {
  const [, tick] = useState(0);

  useEffect(() => {
    const listener = () => tick((n) => n + 1);
    _listeners.add(listener);

    if (!_loaded && !_loading) {
      _loading = true;
      storage.getProfile().then((p) => {
        _profile = p;
        _loaded = true;
        _loading = false;
        notify();
      });
    }

    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const saveProfile = useCallback(async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const next: UserProfile = { ...(_profile ?? DEFAULT_PROFILE), ...updates };
    await storage.saveProfile(next);
    _profile = next;
    notify();
    return next;
  }, []);

  return {
    profile: _profile,
    loading: !_loaded,
    saveProfile,
    isOnboarded: _profile !== null,
  };
}
