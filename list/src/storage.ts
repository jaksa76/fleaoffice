import { useMemo } from 'react';

export interface DirectoryEntry {
  name: string;
  type: 'file' | 'dir';
  size: number;
  mtime: number;
}

export interface Storage {
  fetchJSON(path: string): Promise<unknown>;
  saveJSON(path: string, data: unknown): Promise<void>;
  delete(path: string, recursive?: boolean): Promise<void>;
  listDirectory(path: string): Promise<DirectoryEntry[]>;
}

export function useStorage(): Storage {
  return useMemo(() => ({
    async fetchJSON(path: string): Promise<unknown> {
      const response = await fetch(`/api/list/data${path}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch ${path}`);
      }
      return response.json();
    },

    async saveJSON(path: string, data: unknown): Promise<void> {
      const response = await fetch(`/api/list/data${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Failed to save ${path}`);
    },

    async delete(path: string, recursive = false): Promise<void> {
      const url = recursive ? `${path}?recursive=true` : path;
      const response = await fetch(`/api/list/data${url}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete ${path}`);
    },

    async listDirectory(path: string): Promise<DirectoryEntry[]> {
      const response = await fetch(`/api/list/data${path}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to list ${path}`);
      }
      return response.json();
    }
  }), []);
}
