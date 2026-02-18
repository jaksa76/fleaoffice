import { useMemo } from 'react';
import { DirectoryEntry } from './DirectoryEntry';

export interface Storage {
  fetchJSON(path: string): Promise<unknown>;
  fetchFile(path: string): Promise<string | null>;
  saveJSON(path: string, data: unknown): Promise<boolean>;
  delete(path: string, recursive?: boolean): Promise<void>;
  saveFile(path: string, content: string | Blob, isText?: boolean): Promise<void>;
  uploadFile(path: string, file: File): Promise<void>;
  listDirectory(path: string): Promise<DirectoryEntry[]>;
}

export function useStorage(): Storage {
  return useMemo(() => ({
    async fetchJSON(path: string): Promise<unknown> {
      const response = await fetch(`/api/write/data${path}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch ${path}`);
      }
      return response.json();
    },

    async fetchFile(path: string): Promise<string | null> {
      const response = await fetch(`/api/write/data${path}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch ${path}`);
      }
      return response.text();
    },

    async saveJSON(path: string, data: unknown): Promise<boolean> {
      const response = await fetch(`/api/write/data${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Failed to save ${path}`);
      // Fleabox PUT returns empty response, not JSON
      return true;
    },

    async delete(path: string, recursive = false): Promise<void> {
      const url = recursive ? `${path}?recursive=true` : path;
      const response = await fetch(`/api/write/data${url}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete ${path}`);
    },

    async saveFile(path: string, content: string | Blob, isText = false): Promise<void> {
      const response = await fetch(`/api/write/data${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': isText ? 'text/plain' : 'application/octet-stream' },
        body: content
      });
      if (!response.ok) throw new Error(`Failed to save file ${path}`);
    },

    async uploadFile(path: string, file: File): Promise<void> {
      const response = await fetch(`/api/write/data${path}`, {
        method: 'PUT',
        body: file
      });
      if (!response.ok) throw new Error(`Failed to upload file ${path}`);
    },

    async listDirectory(path: string): Promise<DirectoryEntry[]> {
      const response = await fetch(`/api/write/data${path}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to list ${path}`);
      }
      const entries = await response.json();
      // Returns: [{ name: "file.json", type: "file", size: 1234, mtime: 1234567890 }, ...]
      return entries;
    }
  }), []);
}
