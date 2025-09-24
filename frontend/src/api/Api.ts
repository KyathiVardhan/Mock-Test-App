
const BASE_URL = "http://localhost:5000/api";

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    name: string;
    email: string;
    id: string;
    avatar: string;
    isVerified: boolean;
  };
  token?: string;
}

export const api = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    console.log(data);
    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }
    return data;
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    console.log(data);
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // Important for cookies
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }
};