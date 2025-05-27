import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { HiOutlineShoppingCart, HiArrowLeft, HiOutlineLocationMarker } from "react-icons/hi"; 

// API URL
const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app";

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/barang/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }
        
        const data = await response.json();
        
        // Helper function to get full image URL
        const getImageUrl = (imagePath) => {
          if (!imagePath) return null; // Return null to trigger skeleton
          if (imagePath.startsWith('http')) return imagePath;
          return `${API_BASE_URL}${imagePath}`;
        };
        
        // Format data for component use
        const productData = {
          ...data,
          images: data.image_url ? [getImageUrl(data.image_url)] : ["https://via.placeholder.com/600x400?text=No+Image"]
        };
        
        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product details:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);
  
  // Format price to Rupiah
  const formatPrice = (price) => {
    return `Rp ${parseInt(price).toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/home" className="text-green-600 hover:text-green-800 font-medium flex items-center justify-center">
            <HiArrowLeft className="mr-2" /> Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="h-16"></div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/home" className="inline-flex items-center text-green-600 hover:text-green-800 font-medium mb-6">
          <HiArrowLeft className="mr-2" /> Back to all items
        </Link>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Product Images */}
            <div className="md:w-1/2 p-6">
              <div className="h-80 md:h-96 overflow-hidden rounded-lg mb-4 bg-gray-100">
                {product.images[activeImage] ? (
                  <img 
                    src={product.images[activeImage]} 
                    alt={product.item_name} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.parentNode.classList.add("bg-gray-300");
                      e.target.classList.add("opacity-0");
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 animate-pulse flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Thumbnail images */}
              {product.images.length > 1 && (
                <div className="flex space-x-2 mt-4">
                  {product.images.map((img, index) => (
                    <button 
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                        activeImage === index ? 'border-green-500' : 'border-transparent'
                      }`}
                    >
                      {img ? (
                        <img 
                          src={img} 
                          alt={`${product.item_name} thumbnail ${index + 1}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.parentNode.classList.add("bg-gray-300");
                            e.target.classList.add("opacity-0");
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 animate-pulse flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Details */}
            <div className="md:w-1/2 p-6">
              <div className="mb-8">
                <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{product.item_name}</h1>
                <p className="text-2xl text-green-700 font-bold mt-2">{formatPrice(product.price)}</p>
                
                <div className="flex items-center mt-4">
                  <span className="text-gray-600 mr-4">Condition:</span>
                  <span className="font-medium text-gray-800">{product.condition}</span>
                </div>
                
                <div className="flex items-center mt-2">
                  <HiOutlineLocationMarker className="text-gray-500 mr-2" />
                  <span className="text-gray-600">{product.location || "Location not specified"}</span>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
                
                <div className="mt-8 pt-6">
                  <p className="text-sm text-gray-500 mb-1">Listed by {product.user?.name}</p>
                  <p className="text-sm text-gray-500">Posted on {new Date(product.date_posted).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-8">
                <div className="flex justify-center">
                  <button 
                    onClick={() => navigate('/checkout', { state: { productId: product.item_id } })}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition flex items-center justify-center"
                  >
                    <HiOutlineShoppingCart className="mr-2" />
                    Beli
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
