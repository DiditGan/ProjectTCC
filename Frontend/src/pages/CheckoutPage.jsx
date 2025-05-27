import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { HiCreditCard, HiCash, HiArrowLeft, HiCheck, HiExclamationCircle } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

// API Base URL
const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app";

// Payment methods
const PAYMENT_METHODS = [
  { id: 1, name: "Transfer Bank", type: "bank", fee: 0, icon: HiCreditCard },
  { id: 2, name: "E-Wallet (OVO)", type: "ewallet", fee: 2500, icon: HiCreditCard },
  { id: 3, name: "E-Wallet (GoPay)", type: "ewallet", fee: 2500, icon: HiCreditCard },
  { id: 4, name: "E-Wallet (DANA)", type: "ewallet", fee: 2500, icon: HiCreditCard },
  { id: 5, name: "COD (Cash on Delivery)", type: "cod", fee: 5000, icon: HiCash }
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // State variables
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Fetch product data and user info
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get product ID from URL params or state
        const productId = location.state?.productId;
        
        if (!productId) {
          throw new Error("Product ID not found");
        }
        
        console.log("Fetching product with ID:", productId);
        
        // Fetch real product details from API
        const token = localStorage.getItem('accessToken');
        const productResponse = await fetch(`${API_BASE_URL}/api/barang/${productId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!productResponse.ok) {
          const errorData = await productResponse.json();
          throw new Error(errorData.msg || "Failed to fetch product details");
        }
        
        const productData = await productResponse.json();
        console.log("Product data:", productData);
        
        // Set isOwner flag
        setIsOwner(productData.isOwner || false);
        
        // Check if product is available
        if (productData.status !== 'available') {
          throw new Error("This item is no longer available");
        }
        
        // Prepare product data for checkout with proper image handling
        setProduct({
          id: productData.item_id,
          name: productData.item_name,
          price: productData.price ? `Rp ${Number(productData.price).toLocaleString('id-ID')}` : "Rp 0",
          priceNumeric: Number(productData.price) || 0,
          seller: productData.user?.name || "Unknown Seller",
          sellerId: productData.user_id,
          location: productData.location || "Unknown",
          imageUrl: productData.image_url 
            ? (productData.image_url.startsWith('http') 
              ? productData.image_url 
              : `${API_BASE_URL}${productData.image_url}`)
            : null // Return null to trigger skeleton UI instead of placeholder
        });
        
        // Fetch user profile for pre-filling customer info
        if (token) {
          try {
            const userResponse = await fetch(`${API_BASE_URL}/api/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setCustomerInfo({
                name: userData.name || "",
                email: userData.email || "",
                phone: userData.phone_number || "",
                address: userData.address || ""
              });
            }
          } catch (userError) {
            console.error("Error fetching user data:", userError);
            // Continue with checkout even if user data fetch fails
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const subtotal = product.priceNumeric * quantity;
    const paymentFee = selectedPayment ? selectedPayment.fee : 0;
    return subtotal + paymentFee;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate inputs
    if (!selectedPayment) {
      setError("Silakan pilih metode pembayaran");
      return;
    }
    
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      setError("Semua informasi pembeli harus diisi");
      return;
    }
    
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Anda harus login untuk melakukan pembelian");
      }
      
      // Create transaction data
      const transactionData = {
        item_id: product.id,
        quantity: quantity,
        payment_method: selectedPayment.name,
        shipping_address: customerInfo.address,
        customerInfo
      };
      
      console.log("Sending transaction data:", transactionData);
      
      // Send actual API request to create transaction
      const response = await fetch(`${API_BASE_URL}/api/transaksi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transactionData)
      });
      
      const data = await response.json();
      console.log("Transaction response:", data);
      
      if (!response.ok) {
        // Handle specific error codes
        if (data.code === "SELF_PURCHASE_NOT_ALLOWED") {
          throw new Error("Anda tidak dapat membeli barang Anda sendiri");
        }
        throw new Error(data.msg || "Failed to create transaction");
      }
      
      // Create a serializable version of the payment method object
      // This removes any non-serializable properties
      const serializablePaymentMethod = {
        id: selectedPayment.id,
        name: selectedPayment.name,
        type: selectedPayment.type,
        fee: selectedPayment.fee
      };
      
      // Create a serializable product object
      const serializableProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        priceNumeric: product.priceNumeric,
        seller: product.seller,
        sellerId: product.sellerId,
        location: product.location,
        imageUrl: product.imageUrl
      };
      
      // Navigate to confirmation page with serialized transaction data
      navigate("/confirmation", {
        state: {
          transaction: {
            id: data.data.transaction_id,
            product: serializableProduct,
            quantity,
            paymentMethod: serializablePaymentMethod,
            customerInfo: { ...customerInfo },
            total: calculateTotal(),
            status: data.data.status || "pending"
          }
        }
      });
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto">
          </div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }
  
  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
            <HiExclamationCircle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if user is the owner of the product
  if (isOwner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
            <HiExclamationCircle className="text-yellow-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Anda Tidak Dapat Membeli Barang Sendiri</h2>
            <p className="text-gray-600 mb-6">Anda tidak dapat melakukan pembelian pada barang yang Anda jual.</p>
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-200 rounded-full transition"
          >
            <HiArrowLeft className="text-xl text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <div className="flex items-center">
              <HiExclamationCircle className="text-xl mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pembeli</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  ></textarea>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Metode Pembayaran</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        selectedPayment?.id === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPayment(method)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            selectedPayment?.id === method.id
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedPayment?.id === method.id && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <IconComponent className="text-gray-600 mr-3" />
                          <span className="font-medium text-gray-800">{method.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {method.fee > 0 ? `+Rp ${method.fee.toLocaleString('id-ID')}` : 'Gratis'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h2>
              
              {/* Product Info */}
              <div className="flex items-center mb-4 pb-4 border-b">
                {product?.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product?.name}
                    className="w-16 h-16 object-cover rounded-md mr-4 bg-gray-100"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.parentNode.classList.add("bg-gray-300");
                      e.target.classList.add("opacity-0");
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-md mr-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{product?.name}</h3>
                  <p className="text-sm text-gray-600">Penjual: {product?.seller}</p>
                  <p className="text-green-600 font-semibold">{product?.price}</p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">Jumlah:</span>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 h-8 flex items-center justify-center border-t border-b border-gray-300 bg-gray-50">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({quantity} item):</span>
                  <span>Rp {(product?.priceNumeric * quantity).toLocaleString('id-ID')}</span>
                </div>
                {selectedPayment && selectedPayment.fee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Biaya Admin:</span>
                    <span>Rp {selectedPayment.fee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isLoading || !selectedPayment}
                className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                  isLoading || !selectedPayment
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  'Buat Pesanan'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;