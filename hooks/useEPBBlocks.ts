import { useState, useEffect, useCallback } from 'react';
import { MPA, MPABlock } from '../types';
import { MPA_ORDER, MPA_CHAR_LIMIT } from '../constants/mpa';
import * as storage from '../services/storage';

function buildDefaultBlocks(): MPABlock[] {
  return MPA_ORDER.map((mpa) => ({ mpa, statements: [], characterCount: 0 }));
}

function recalc(block: MPABlock): MPABlock {
  const characterCount = block.statements.join(' ').length;
  return { ...block, characterCount };
}

let _blocks: MPABlock[] = buildDefaultBlocks();
let _loaded = false;
let _loading = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

async function persist(next: MPABlock[]) {
  await storage.saveMPABlocks(next);
  _blocks = next;
  notify();
}

export function useEPBBlocks() {
  const [, tick] = useState(0);

  useEffect(() => {
    const listener = () => tick((n) => n + 1);
    _listeners.add(listener);

    if (!_loaded && !_loading) {
      _loading = true;
      storage.getMPABlocks().then((saved) => {
        if (saved.length > 0) {
          const merged = MPA_ORDER.map(
            (mpa) => saved.find((b) => b.mpa === mpa) ?? { mpa, statements: [], characterCount: 0 }
          );
          _blocks = merged;
        }
        _loaded = true;
        _loading = false;
        notify();
      });
    }

    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const addStatement = useCallback(async (mpa: MPA, statement: string): Promise<boolean> => {
    const block = _blocks.find((b) => b.mpa === mpa)!;
    const proposed = recalc({ ...block, statements: [...block.statements, statement] });
    if (proposed.characterCount > MPA_CHAR_LIMIT) return false;
    await persist(_blocks.map((b) => (b.mpa === mpa ? proposed : b)));
    return true;
  }, []);

  const removeStatement = useCallback(async (mpa: MPA, index: number): Promise<void> => {
    const block = _blocks.find((b) => b.mpa === mpa)!;
    const statements = block.statements.filter((_, i) => i !== index);
    await persist(_blocks.map((b) => (b.mpa === mpa ? recalc({ ...b, statements }) : b)));
  }, []);

  const updateStatement = useCallback(
    async (mpa: MPA, index: number, statement: string): Promise<boolean> => {
      const block = _blocks.find((b) => b.mpa === mpa)!;
      const statements = block.statements.map((s, i) => (i === index ? statement : s));
      const proposed = recalc({ ...block, statements });
      if (proposed.characterCount > MPA_CHAR_LIMIT) return false;
      await persist(_blocks.map((b) => (b.mpa === mpa ? proposed : b)));
      return true;
    },
    []
  );

  const getBlock = useCallback((mpa: MPA): MPABlock => _blocks.find((b) => b.mpa === mpa)!, []);

  return { blocks: _blocks, loading: !_loaded, addStatement, removeStatement, updateStatement, getBlock };
}
