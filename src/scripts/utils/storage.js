const STORAGE_KEY = 'story-app-token';
const USER_KEY = 'story-app-user';

export function saveAuthToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function getAuthToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function removeAuthToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getAuthToken();
}

