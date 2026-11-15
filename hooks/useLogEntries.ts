import { useState, useEffect, useCallback } from 'react';
import { LogEntry, MPA } from '../types';
import * as storage from '../services/storage';

let _entries: LogEntry[] = [];
let _loaded = false;
let _loading = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useLogEntries() {
  const [, tick] = useState(0);

  useEffect(() => {
    const listener = () => tick((n) => n + 1);
    _listeners.add(listener);

    if (!_loaded && !_loading) {
      _loading = true;
      storage.getLogEntries().then((e) => {
        _entries = e;
        _loaded = true;
        _loading = false;
        notify();
      });
    }

    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const addEntry = useCallback(async (data: Omit<LogEntry, 'id' | 'createdAt'>): Promise<LogEntry> => {
    const entry: LogEntry = {
      ...data,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ..._entries];
    await storage.saveLogEntries(next);
    _entries = next;
    notify();
    return entry;
  }, []);

  const updateEntry = useCallback(async (id: string, updates: Partial<LogEntry>): Promise<void> => {
    const next = _entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    await storage.saveLogEntries(next);
    _entries = next;
    notify();
  }, []);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    const next = _entries.filter((e) => e.id !== id);
    await storage.saveLogEntries(next);
    _entries = next;
    notify();
  }, []);

  const getEntry = useCallback((id: string): LogEntry | undefined => {
    return _entries.find((e) => e.id === id);
  }, []);

  const getEntriesByMPA = useCallback((mpa: MPA): LogEntry[] => {
    return _entries.filter((e) => e.mpa === mpa);
  }, []);

  return {
    entries: _entries,
    loading: !_loaded,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getEntriesByMPA,
  };
}
