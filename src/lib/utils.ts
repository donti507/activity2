export function fmtDate(s: string) {
  if (!s) return '';
  return new Date(s + 'T00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export function fmtDateTime(s: string) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function fmtBytes(b: number) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b / 1024).toFixed(1) + 'KB';
  return (b / 1048576).toFixed(1) + 'MB';
}

export function getCatColor(id: string, theme: 'light' | 'dark' = 'dark') {
  if (theme === 'light') {
    const map: Record<string, string> = {
      radio: '#5b2cab', // Deep Purple
      research: '#0369a1', // Deep Sky Blue
      application: '#c2410c', // Deep Orange / Copper
      other: '#475569', // Slate Gray
    };
    return map[id] || '#c2410c';
  } else {
    const map: Record<string, string> = {
      radio: '#d5c3ff', // Pastel Purple
      research: '#a5e7ff', // Pastel Blue
      application: '#ff9800', // Neon Orange
      other: '#8aa399', // Muted Teal/Gray
    };
    return map[id] || '#ffc081';
  }
}

