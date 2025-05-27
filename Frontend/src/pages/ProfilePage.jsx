import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { 
  HiUser, HiShoppingBag, HiClipboardList, HiCog, HiLogout, 
  HiEye, HiOutlinePhotograph, HiTrash, HiExclamationCircle, 
  HiOutlineLockClosed 
} from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

// Define the API base URL for real API calls
const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app";

const ProfilePage = () => {
  const { currentUser, logout, updateUserData, deleteAccount } = useAuth(); 
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState("purchases");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state variables for account deletion
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  
  // New state variable for transaction deletion
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real user profile data
        const userResponse = await fetchUserProfile();
        setUser(userResponse);
        setEditData({
          name: userResponse.name,
          email: userResponse.email,
          phone: userResponse.phone_number || "",
          address: userResponse.address || ""
        });
        
        // Fetch real transactions (purchases)
        const transactionsResponse = await fetchTransactions("purchase");
        setTransactions(transactionsResponse);
        
        // Fetch real sales
        const salesResponse = await fetchTransactions("sale");
        setSales(salesResponse);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch real user profile from API
  const fetchUserProfile = async () => {
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
    
    return await response.json();
  };

  // Fetch real transactions from API
  const fetchTransactions = async (type) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error("Authentication token not found");
    }
    
    const response = await fetch(`${API_BASE_URL}/api/transaksi?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} transactions`);
    }
    
    return await response.json();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to get full profile image URL with better error handling
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null; // Return null to trigger skeleton UI
    if (imagePath.startsWith('http')) return imagePath;
    // Ensure path starts with /
    return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`; 
  };

  // Handle profile image upload
  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset previous error messages
    setProfileError("");
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileError('File harus berupa gambar (JPEG, PNG, GIF)');
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Ukuran file tidak boleh lebih dari 2MB');
      return;
    }
    
    setProfileImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    console.log("Profile image selected:", file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
  };

  const handleSaveProfile = async () => {
    try {
      setProfileError("");
      setProfileSuccess("");
      setIsSubmitting(true);
      
      // Validate form data
      if (!editData.name || !editData.email) {
        setProfileError("Nama dan email wajib diisi");
        setIsSubmitting(false);
        return;
      }
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('name', editData.name);
        formData.append('email', editData.email);
        formData.append('phone_number', editData.phone || ''); // Ensure empty string if null/undefined
        formData.append('address', editData.address || ''); // Ensure empty string
        
        // Add profile image file if selected
        if (profileImageFile) {
          formData.append('profileImage', profileImageFile);
          console.log("Uploading profile image:", profileImageFile.name);
        }
        
        // Log form data for debugging
        for (let [key, value] of formData.entries()) {
          console.log(`FormData - ${key}: ${value instanceof File ? value.name : value}`);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`
            // 'Content-Type' is automatically set by browser for FormData
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.msg || "Failed to update profile");
        }
        
        console.log("Profile updated successfully:", data);
        
        // Update local user state with new data
        setUser(data.user);
        updateUserData(data.user); // Update AuthContext
        setEditData({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone_number || "",
          address: data.user.address || ""
        });
        
        setProfileSuccess("Profil berhasil diperbarui");
        setIsEditing(false);
        setProfileImageFile(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      sold: "bg-blue-100 text-blue-800"
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status === "completed" ? "Selesai" : 
         status === "pending" ? "Menunggu" : 
         status === "cancelled" ? "Dibatalkan" : 
         status === "sold" ? "Terjual" : status}
      </span>
    );
  };

  // Format date from ISO string to local format
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/transaksi/${transactionId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to delete transaction");
      }
      
      // Update state to remove the deleted transaction
      if (activeTab === "purchases") {
        setTransactions(transactions.filter(t => t.transaction_id !== transactionId));
      } else {
        setSales(sales.filter(t => t.transaction_id !== transactionId));
      }
      
      setShowDeleteTransactionModal(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert(error.message);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }
    
    try {
      setIsDeleting(true);
      setDeleteError("");
      
      await deleteAccount(deletePassword);
      // If successful, user will be logged out and redirected automatically
      
    } catch (error) {
      setDeleteError(error.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
            <p className="text-gray-600">Kelola akun dan aktivitas Anda di GiveTzy</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* User Info in Sidebar */}
                <div className="p-6 text-center border-b">
                  <div className="relative inline-block mb-3">
                    {imagePreview || getProfileImageUrl(user?.profile_picture) ? (
                      <img
                        src={imagePreview || getProfileImageUrl(user?.profile_picture)}
                        alt={user?.name || 'User'}
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-green-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.parentNode.classList.add("bg-gray-300");
                          e.target.classList.add("opacity-0");
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto bg-gray-300 border-4 border-green-100 flex items-center justify-center animate-pulse">
                        <svg className="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    {isEditing && activeTab === "settings" && (
                      <div className="absolute bottom-0 right-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-xs font-medium">Edit Foto</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-xl text-gray-800">{user?.name || 'User Name'}</h3>
                  <p className="text-sm text-gray-600">{user?.email || 'user@example.com'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Bergabung sejak {formatDate(user?.createdAt || user?.created_at || new Date().toISOString())}
                  </p>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4">
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setActiveTab("purchases")}
                        className={`w-full flex items-center px-3 py-2 rounded-md text-left transition ${
                          activeTab === "purchases"
                            ? "bg-green-100 text-green-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <HiShoppingBag className="mr-3" />
                        Riwayat Pembelian
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab("sales")}
                        className={`w-full flex items-center px-3 py-2 rounded-md text-left transition ${
                          activeTab === "sales"
                            ? "bg-green-100 text-green-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <HiClipboardList className="mr-3" />
                        Riwayat Penjualan
                      </button>
                    </li>
                    <li>
                      <Link
                        to="/manage-products"
                        className="w-full flex items-center px-3 py-2 rounded-md text-left text-gray-700 hover:bg-gray-100 transition"
                      >
                        <HiCog className="mr-3" />
                        Kelola Barang
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab("settings")}
                        className={`w-full flex items-center px-3 py-2 rounded-md text-left transition ${
                          activeTab === "settings"
                            ? "bg-green-100 text-green-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <HiUser className="mr-3" />
                        Pengaturan Profil
                      </button>
                    </li>
                    <li className="border-t pt-2 mt-2">
                      <button 
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="w-full flex items-center px-3 py-2 rounded-md text-left text-red-600 hover:bg-red-50 transition"
                      >
                        <HiTrash className="mr-3" />
                        Hapus Akun
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 rounded-md text-left text-red-600 hover:bg-red-50 transition"
                      >
                        <HiLogout className="mr-3" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Purchase History */}
              {activeTab === "purchases" && (
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Riwayat Pembelian</h2>
                  </div>
                  <div className="p-6">
                    {transactions && transactions.length > 0 ? (
                      <div className="space-y-4">
                        {transactions.map(transaction => (
                          <div key={transaction.transaction_id || transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-800">#{transaction.transaction_id || transaction.id}</span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{formatDate(transaction.transaction_date || transaction.date)}</span>
                              </div>
                              {getStatusBadge(transaction.status)}
                            </div>
                            
                            <div className="flex items-center">
                              {getProfileImageUrl(transaction.item?.image_url || transaction.product?.imageUrl) ? (
                                <img
                                  src={getProfileImageUrl(transaction.item?.image_url || transaction.product?.imageUrl)}
                                  alt={transaction.item?.item_name || transaction.product?.name}
                                  className="w-16 h-16 object-cover rounded-md mr-4 bg-gray-100"
                                  onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.parentNode.classList.add("bg-gray-300");
                                    e.target.classList.add("opacity-0");
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-300 rounded-md mr-4 flex items-center justify-center animate-pulse">
                                  <svg className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{transaction.item?.item_name || transaction.product?.name}</h4>
                                <p className="text-sm text-gray-600">
                                  Penjual: {transaction.seller?.name || transaction.product?.seller || '-'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Jumlah: {transaction.quantity || 1}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Pembayaran: {transaction.payment_method || transaction.paymentMethod || 'Cash'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  Rp {(transaction.total_price || transaction.total || 0).toLocaleString('id-ID')}
                                </p>
                                <div className="flex items-center justify-end mt-1">
                                  <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center mr-3">
                                    <span>Lihat Detail</span>
                                    <HiEye className="ml-1" />
                                  </button>
                                  <button 
                                    onClick={() => setShowDeleteTransactionModal(transaction.transaction_id || transaction.id)}
                                    className="text-sm text-red-600 hover:text-red-800 flex items-center"
                                  >
                                    <span>Hapus</span>
                                    <HiTrash className="ml-1" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <HiShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada riwayat pembelian</p>
                        <Link to="/home" className="text-green-600 hover:text-green-800 font-medium mt-2 inline-block">
                          Mulai Belanja
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sales History */}
              {activeTab === "sales" && (
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Riwayat Penjualan</h2>
                  </div>
                  <div className="p-6">
                    {sales && sales.length > 0 ? (
                      <div className="space-y-4">
                        {sales.map(sale => (
                          <div key={sale.transaction_id || sale.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-800">#{sale.transaction_id || sale.id}</span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{formatDate(sale.transaction_date || sale.date)}</span>
                              </div>
                              {getStatusBadge(sale.status)}
                            </div>
                            
                            <div className="flex items-center">
                              {getProfileImageUrl(sale.item?.image_url || sale.product?.imageUrl) ? (
                                <img
                                  src={getProfileImageUrl(sale.item?.image_url || sale.product?.imageUrl)}
                                  alt={sale.item?.item_name || sale.product?.name}
                                  className="w-16 h-16 object-cover rounded-md mr-4 bg-gray-100"
                                  onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.parentNode.classList.add("bg-gray-300");
                                    e.target.classList.add("opacity-0");
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-300 rounded-md mr-4 flex items-center justify-center animate-pulse">
                                  <svg className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{sale.item?.item_name || sale.product?.name}</h4>
                                <p className="text-sm text-gray-600">
                                  Pembeli: {sale.buyer?.name || sale.buyer || '-'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Jumlah: {sale.quantity || 1}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  Rp {(sale.total_price || sale.total || 0).toLocaleString('id-ID')}
                                </p>
                                <div className="flex items-center justify-end mt-1">
                                  <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center mr-3">
                                    <span>Lihat Detail</span>
                                    <HiEye className="ml-1" />
                                  </button>
                                  <button 
                                    onClick={() => setShowDeleteTransactionModal(sale.transaction_id || sale.id)}
                                    className="text-sm text-red-600 hover:text-red-800 flex items-center"
                                  >
                                    <span>Hapus</span>
                                    <HiTrash className="ml-1" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <HiClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada penjualan</p>
                        <Link to="/manage-products" className="text-green-600 hover:text-green-800 font-medium mt-2 inline-block">
                          Jual Barang Pertama
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Settings */}
              {activeTab === "settings" && (
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Pengaturan Profil</h2>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition"
                      >
                        Edit Profil
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    {profileError && (
                      <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                        {profileError}
                      </div>
                    )}
                    
                    {profileSuccess && (
                      <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
                        {profileSuccess}
                      </div>
                    )}
                    
                    {/* Profile Image Upload Section */}
                    {isEditing && (
                      <div className="mb-6 flex flex-col items-center">
                        <div className="relative">
                          {imagePreview || getProfileImageUrl(user?.profile_picture) ? (
                            <img
                              src={imagePreview || getProfileImageUrl(user?.profile_picture)}
                              alt={user?.name || 'User'}
                              className="w-32 h-32 rounded-full object-cover border-4 border-green-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.parentNode.classList.add("bg-gray-300");
                                e.target.classList.add("opacity-0");
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-300 border-4 border-green-100 flex items-center justify-center animate-pulse">
                              <svg className="w-16 h-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <label className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-3 cursor-pointer shadow-lg hover:bg-green-700 transition-colors">
                            <HiOutlinePhotograph className="w-5 h-5" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleProfileImageUpload}
                            />
                          </label>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">Klik ikon kamera untuk mengganti foto profil</p>
                        {profileImageFile && (
                          <div className="text-xs text-green-600 mt-1">
                            {profileImageFile.name} ({(profileImageFile.size/1024).toFixed(1)} KB)
                            <button 
                              onClick={() => {
                                setProfileImageFile(null);
                                setImagePreview(null);
                              }}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Lengkap
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={editData.name || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          ) : (
                            <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-800">{user?.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={editData.email || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          ) : (
                            <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-800">{user?.email}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor Telepon
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={editData.phone || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        ) : (
                          <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-800">{user?.phone_number || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alamat
                        </label>
                        {isEditing ? (
                          <textarea
                            name="address"
                            value={editData.address || ''}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          ></textarea>
                        ) : (
                          <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-800">{user?.address || '-'}</p>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="flex justify-end space-x-3 pt-3">
                          <button 
                            onClick={() => {
                              setIsEditing(false);
                              setProfileError("");
                              setProfileSuccess("");
                              setProfileImageFile(null);
                              setImagePreview(null);
                              // Reset form data
                              setEditData({
                                name: user.name,
                                email: user.email,
                                phone: user.phone_number || "",
                                address: user.address || ""
                              });
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                            disabled={isSubmitting}
                          >
                            Batal
                          </button>
                          <button 
                            onClick={handleSaveProfile}
                            className={`px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={isSubmitting}
                          >
                            {isSubmitting && (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-6 text-red-600">
              <HiExclamationCircle className="text-5xl" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Hapus Akun Anda?</h3>
            <p className="text-gray-600 text-center mb-6">
              Tindakan ini tidak dapat dibatalkan. Semua data Anda, termasuk profil, barang, dan transaksi akan dihapus secara permanen.
            </p>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                {deleteError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi dengan Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteAccount}
                className={`px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition flex items-center ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isDeleting || !deletePassword}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <HiTrash className="mr-2" />
                    Hapus Akun Saya
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Transaction Modal */}
      {showDeleteTransactionModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Konfirmasi Penghapusan</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteTransactionModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteTransaction(showDeleteTransactionModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition flex items-center"
              >
                <HiTrash className="mr-2" />
                Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
