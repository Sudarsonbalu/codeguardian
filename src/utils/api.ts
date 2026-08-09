export const getApiUrl = (path: string): string => {
  const isBrowser = typeof window !== 'undefined';
  const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  if (!baseUrl) {
    if (isLocalhost) {
      baseUrl = 'http://localhost:8000';
    } else {
      baseUrl = '';
    }
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export const getWsUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (typeof window === 'undefined') {
    return `ws://localhost:8000${cleanPath}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws');
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    return `${cleanUrl}${cleanPath}`;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `ws://localhost:8000${cleanPath}`;
  }

  return `${protocol}//${window.location.host}${cleanPath}`;
};
