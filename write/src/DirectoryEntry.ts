export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
  mtime: number;
}
