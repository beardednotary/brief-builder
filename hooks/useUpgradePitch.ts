import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useProfile } from './useProfile';
import { useEPBBlocks } from './useEPBBlocks';
import { useLogEntries } from './useLogEntries';
import { FREE_POLISH_LIMIT } from './usePolish';
import * as storage from '../services/storage';
import { EPB_TARGET_STATEMENTS } from '../constants/mpa';

/** Whole days from today until an ISO date (YYYY-MM-DD). Negative once it has passed. */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export interface UpgradePitch {
  isPro: boolean;
  /** Null until loaded from storage. */
  freeWritesLeft: number | null;
  statementsDone: number;
  /** Statements still missing to reach the EPB target of 8. */
  statementsNeeded: number;
  /** Logged entries not yet turned into a statement. */
  entriesWaiting: number;
  entriesLogged: number;
  /** Close-out date as "March 31", or null when unknown or already past. */
  closeOutLabel: string | null;
  daysToCloseOut: number | null;
}

/**
 * The numbers behind every upgrade prompt: how far along the EPB is, how
 * many free writes are left, and how long until close-out. Free writes are
 * re-read each time the screen comes into focus.
 */
export function useUpgradePitch(): UpgradePitch {
  const { profile } = useProfile();
  const { blocks } = useEPBBlocks();
  const { entries } = useLogEntries();
  const [freeWritesLeft, setFreeWritesLeft] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      storage.getPolishCount().then((used) => {
        if (active) setFreeWritesLeft(Math.max(0, FREE_POLISH_LIMIT - used));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const statementsDone = blocks.reduce((sum, b) => sum + b.statements.length, 0);
  const closeOut = profile?.reportingPeriodEnd;
  const days = closeOut ? daysUntil(closeOut) : null;
  const upcoming = days !== null && days > 0;

  return {
    isPro: Boolean(profile?.isPro),
    freeWritesLeft,
    statementsDone,
    statementsNeeded: Math.max(0, EPB_TARGET_STATEMENTS - statementsDone),
    entriesWaiting: entries.filter((e) => e.status !== 'finalized').length,
    entriesLogged: entries.length,
    closeOutLabel:
      upcoming && closeOut
        ? new Date(closeOut + 'T12:00:00').toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })
        : null,
    daysToCloseOut: upcoming ? days : null,
  };
}

/** "1 statement", "3 statements"; pass the plural for irregular words ("entries"). */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
