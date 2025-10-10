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

interface TestRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    subject: string;
    totalQuestions: number;
    duration: number;
    createdAt?: string;
    updatedAt?: string;
    newQuestionsAdded?: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export const api = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
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

  // Updated registerTest method to handle FormData properly
  registerTest: async (formData: FormData): Promise<TestRegistrationResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/tests/register`, {
        method: 'POST',
        headers: {
          // Note: Don't set Content-Type for FormData
          Authorization: `Bearer ${localStorage.getItem('adminToken')}` // Add admin token
        },
        credentials: 'include',
        body: formData, // Send FormData directly
      });

      const data = await response.json();

      if (!response.ok) {
        // Create a proper error object with response data
        const error = new Error(data.message || 'Test registration failed');
        (error as any).response = { data };
        console.log('Server response:', data); // Log the full server response
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error in registerTest:', error);
      throw error;
    }
  },

  
};
