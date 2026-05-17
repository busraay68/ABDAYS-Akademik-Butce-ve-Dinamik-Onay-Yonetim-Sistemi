import { http } from './http';

export const authService = {
  async login(credentials) {
    const { data } = await http.post('/auth/login', credentials);
    return data;
  },

  async register(payload) {
    const { data } = await http.post('/auth/register', payload);
    return data;
  },

  async fetchPasswordPolicy() {
    const { data } = await http.get('/auth/password-policy');
    return data;
  },
};
