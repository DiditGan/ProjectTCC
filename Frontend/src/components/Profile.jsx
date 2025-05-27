import { useState, useEffect } from "react";
import { HiX, HiOutlineCamera, HiOutlineShieldCheck, HiOutlineLogout } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";

// API URL
const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app/";

// Default profile image if none is set
const defaultProfileImage = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

const Profile = ({ onClose }) => {
  const navigate = useNavigate();
  const { currentUser, logout, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // profile or password
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Image upload preview state
  const [imagePreview, setImagePreview] = useState(null);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error("Authentication token not found");
        }
        
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        
        const userData = await response.json();
        setUser(userData);
        setEditedUser({
          fullName: userData.name,
          email: userData.email,
          phoneNumber: userData.phone_number || "",
          location: userData.address || "",
          profileImage: userData.profile_picture
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  
  // Handle profile edit 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    
    // Store the actual file for upload
    setEditedUser(prev => ({
      ...prev,
      profileImageFile: file
    }));
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle password change input
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save profile changes
  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('name', editedUser.fullName);
      formData.append('email', editedUser.email);
      formData.append('phone_number', editedUser.phoneNumber);
      formData.append('address', editedUser.location);
      
      // Add profile image file if selected
      if (editedUser.profileImageFile) {
        formData.append('profileImage', editedUser.profileImageFile);
        console.log("Uploading profile image:", editedUser.profileImageFile.name);
      }
      
      console.log("Form data to be sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to update profile");
      }
      
      const result = await response.json();
      console.log("Profile update response:", result);
      
      // Update user state with response data
      setUser(result.user);
      setEditedUser({
        fullName: result.user.name,
        email: result.user.email,
        phoneNumber: result.user.phone_number || "",
        location: result.user.address || "",
        profileImage: result.user.profile_picture
      });
      
      // Update the user data in AuthContext
      if (updateUserData) {
        updateUserData(result.user);
      }
      
      setIsEditing(false);
      setImagePreview(null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message);
    }
  };
  
  // Save password changes
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    
    try {
      // Simple validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("New passwords don't match!");
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        alert("Password must be at least 8 characters!");
        return;
      }
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to update password");
      }
      
      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert(error.message);
    }
  };

  // Logout function
  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  // Helper function to get profile image URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return defaultProfileImage;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
          <HiX className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">User Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "profile" 
                ? "text-green-600 border-b-2 border-green-600" 
                : "text-gray-600 hover:text-green-600"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "password" 
                ? "text-green-600 border-b-2 border-green-600" 
                : "text-gray-600 hover:text-green-600"
            }`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>
        
        {/* Profile Content */}
        {activeTab === "profile" && (
          <div className="p-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-500">
                  <img 
                    src={imagePreview || getProfileImageUrl(user.profile_picture)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = defaultProfileImage;
                    }}
                  />
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 cursor-pointer shadow-md">
                    <HiOutlineCamera className="w-4 h-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              <h3 className="font-bold text-xl mt-2">{user.name}</h3>
            </div>
            
            {/* User Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={editedUser.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editedUser.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user.phone_number || "-"}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={editedUser.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user.address || "-"}</p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Password Change Content */}
        {activeTab === "password" && (
          <div className="p-6">
            <form onSubmit={handlePasswordSave}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center"
                >
                  <HiOutlineShieldCheck className="mr-2" />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Logout Button */}
        <div className="px-6 py-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center justify-center"
          >
            <HiOutlineLogout className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
