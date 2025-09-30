import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
    const { adminLogout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await adminLogout();
            // Navigate to admin login page after successful logout
            navigate('/adminPage');
        } catch (error) {
            console.error('Logout failed:', error);
            // Optionally show error message to user
        }
    };

    return (
        <>
            
        </>
    );
}

export default AdminDashboard;
