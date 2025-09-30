
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
    subscription: string;
    testsCompleted: number;
  };
  token?: string;
}

interface AdminLoginData {
  email: string;
  password: string;
}

interface AdminAuthResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    role: string;
    loginTime?: string;
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
  },
  adminLogin: async (email: string, password: string): Promise<AdminAuthResponse> => {
    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Admin login failed');
    }

    // Store the admin token if it exists in the response
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
    }

    return data;
  },
  adminLogout: async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Admin logout failed');
    }
  },

  adminApiCall: async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const adminToken = localStorage.getItem('adminToken');
    
    const response = await fetch(`${BASE_URL}/admin${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': adminToken ? `Bearer ${adminToken}` : '',
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Admin API call failed');
    }

    return data;
  },

  registerTest: async (testData: any): Promise<any> => {
    const adminToken = localStorage.getItem('adminToken');
    
    const response = await fetch(`${BASE_URL}/test/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Test registration failed');
    }

    return data;
  }
};