import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'rs': return 'rust';
    case 'py': return 'python';
    case 'md': return 'markdown';
    case 'sql': return 'sql';
    case 'xml': return 'xml';
    case 'yaml': return 'yaml';
    case 'yml': return 'yaml';
    default: return 'plaintext';
  }
}
