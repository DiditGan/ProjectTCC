import { useState, useEffect } from "react";
import logoImage from "../assets/logo.png";
import { HiOutlineMenu, HiOutlineX, HiOutlineChatAlt2, HiOutlineShoppingBag, HiOutlineUser } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app";
const defaultProfileImage = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
    if (isOpen) setIsOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
    if (isOpen) setIsOpen(false);
  };
  
  // Helper function to get full profile image URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return defaultProfileImage;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-3'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to={"/"} className="flex items-center">
            <img src={logoImage} alt="GiveTzy Logo" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/home"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300"
            >
              Beranda
            </Link>
            
            {!currentUser && (
              <a
                href="/#about"
                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300"
              >
                Tentang Kami
              </a>
            )}
            
            {currentUser && (
              <>
                <Link 
                  to="/manage-products"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300 flex items-center"
                >
                  <HiOutlineShoppingBag className="w-5 h-5 mr-1" />
                  Produk Saya
                </Link>
              </>
            )}
            
            {/* User Profile Button */}
            {currentUser ? (
              <div className="relative group">
                <button
                  className="flex items-center space-x-2 bg-green-100 rounded-full pr-4 pl-1 py-1 hover:bg-green-200 transition-colors duration-300"
                >
                  {currentUser.profile_picture ? (
                    <img
                      src={getProfileImageUrl(currentUser.profile_picture)}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-green-500 object-cover"
                      onError={(e) => {
                        e.target.src = defaultProfileImage;
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-green-500 flex items-center justify-center animate-pulse">
                      <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <span className="capitalize text-green-800 font-medium">
                    {currentUser.name || 'Profile'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="py-1">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profil Saya
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
              >
                Masuk
              </Link>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="md:hidden flex items-center">
            {currentUser && (
              <Link to="/messages" className="text-gray-700 hover:text-green-600 mr-4">
                <HiOutlineChatAlt2 className="w-6 h-6" />
              </Link>
            )}
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-green-600 focus:outline-none"
            >
              {isOpen ? (
                <HiOutlineX className="w-6 h-6" />
              ) : (
                <HiOutlineMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden bg-white py-4 absolute left-0 right-0 shadow-md">
            <div className="flex flex-col space-y-3 px-4">
              <Link
                to="/home"
                className="text-gray-700 hover:text-green-600 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Beranda
              </Link>
              
              {!currentUser && (
                <a
                  href="/#about"
                  className="text-gray-700 hover:text-green-600 font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Tentang Kami
                </a>
              )}
              
              {currentUser && (
                <>
                  <Link
                    to="/manage-products"
                    className="text-gray-700 hover:text-green-600 font-medium py-2 flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <HiOutlineShoppingBag className="w-5 h-5 mr-2" />
                    Produk Saya
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-green-600 font-medium py-2 flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <HiOutlineUser className="w-5 h-5 mr-2" />
                    Profil Saya
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 font-medium py-2 text-left"
                  >
                    Keluar
                  </button>
                </>
              )}
              
              {!currentUser && (
                <Link
                  to="/login"
                  className="bg-green-600 text-white py-2 px-4 rounded-md text-center font-medium hover:bg-green-700"
                  onClick={() => setIsOpen(false)}
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
