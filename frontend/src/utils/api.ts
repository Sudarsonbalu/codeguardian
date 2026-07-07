export const getApiUrl = (path: string): string => {
  const defaultUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? '' 
    : 'http://localhost:8000';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
  // Strip trailing slash if present
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Ensure path starts with slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export const getWsUrl = (path: string): string => {
  const apiUrl = getApiUrl(path);
  return apiUrl.replace(/^http/, 'ws');
};
