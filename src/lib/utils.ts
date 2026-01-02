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
    case 'htm': return 'html';
    case 'css': return 'css';
    case 'scss': return 'scss';
    case 'sass': return 'sass';
    case 'less': return 'less';
    case 'json': return 'json';
    case 'rs': return 'rust';
    case 'py': return 'python';
    case 'pyw': return 'python';
    case 'md': return 'markdown';
    case 'sql': return 'sql';
    case 'xml': return 'xml';
    case 'yaml': return 'yaml';
    case 'yml': return 'yaml';
    case 'java': return 'java';
    case 'c': return 'c';
    case 'h': return 'c';
    case 'cpp': return 'cpp';
    case 'cc': return 'cpp';
    case 'cxx': return 'cpp';
    case 'hpp': return 'cpp';
    case 'cs': return 'csharp';
    case 'go': return 'go';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'sh': return 'shell';
    case 'bash': return 'shell';
    case 'zsh': return 'shell';
    case 'ps1': return 'powershell';
    case 'swift': return 'swift';
    case 'kt': return 'kotlin';
    case 'scala': return 'scala';
    case 'r': return 'r';
    case 'dart': return 'dart';
    case 'lua': return 'lua';
    case 'pl': return 'perl';
    case 'pm': return 'perl';
    case 'dockerfile': return 'dockerfile';
    case 'makefile': return 'makefile';
    case 'gradle': return 'gradle';
    case 'toml': return 'toml';
    case 'ini': return 'ini';
    case 'cfg': return 'ini';
    case 'conf': return 'ini';
    case 'vue': return 'vue';
    case 'svelte': return 'svelte';
    case 'graphql': return 'graphql';
    case 'proto': return 'protobuf';
    case 'tex': return 'latex';
    case 'bat': return 'bat';
    case 'cmd': return 'bat';
    default: return 'plaintext';
  }
}