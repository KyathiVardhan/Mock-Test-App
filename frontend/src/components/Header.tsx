import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scale, User, LogOut, Home, BookOpen, Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#3C222F] shadow-sm border-b border-gray-200">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-[#d5a661] p-1.5 sm:p-2 rounded-lg">
              <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-white">
              Edvantage Digital
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-1 text-[#d5a661] hover:text-white transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/subscription" 
                  className="flex items-center space-x-1 text-[#d5a661] hover:text-white transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Subscription</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-[#d5a661] hover:text-white transition-colors">
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      user.subscription === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                      user.subscription === 'pro' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {user.subscription}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-[#3C222F] rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-[#d5a661] hover:text-white"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-[#d5a661] hover:text-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-[#d5a661] hover:text-white hover:bg-[#d5a661] px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-[#d5a661] text-white px-4 py-2 hover:text-black rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#d5a661] hover:text-white transition-colors p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-2">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-2 px-3 py-2 text-white border-b border-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{user.name}</span>
                    <div className={`px-2 py-1 text-xs rounded-full ml-auto ${
                      user.subscription === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                      user.subscription === 'pro' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {user.subscription}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <Link 
                    to="/dashboard" 
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-2 text-[#d5a661] hover:bg-[#4a2a3d] hover:text-white rounded-lg transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/subscription" 
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-2 text-[#d5a661] hover:bg-[#4a2a3d] hover:text-white rounded-lg transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Subscription</span>
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-2 text-[#d5a661] hover:bg-[#4a2a3d] hover:text-white rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-[#d5a661] hover:bg-[#4a2a3d] hover:text-white rounded-lg transition-colors text-left w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-3">
                  <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className="text-center text-[#d5a661] hover:bg-[#4a2a3d] hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={closeMobileMenu}
                    className="text-center bg-[#d5a661] text-white px-4 py-2 hover:bg-[#c49551] rounded-lg transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
