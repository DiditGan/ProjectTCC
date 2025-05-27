import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { HiSearch, HiFilter } from "react-icons/hi";

// API URL
const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app";

const PRODUCT_CATEGORIES = [
  "All Items",
  "Furniture",
  "Electronics",
  "Clothing",
  "Books",
  "Kitchenware",
  "Toys",
  "Sports"
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedCategory && selectedCategory !== "All Items") {
        params.append('category', selectedCategory);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/barang?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      console.log("Fetched products:", data);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  // Format price to Rupiah
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "Rp 0";
    return `Rp ${parseInt(price).toLocaleString('id-ID')}`;
  };

  // Helper function to get full image URL with better error handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return null; // Return null to trigger skeleton UI
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a relative path, prepend the API base URL
    return `${API_BASE_URL}${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Banner with Search */}
      <div className="h-16"></div>

      <div className="bg-gradient-to-r from-green-600 to-green-800 pb-16 pt-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
            Find Pre-loved Items at Affordable Prices
          </h1>
          <p className="text-green-100 text-center max-w-xl mx-auto mb-8">
            Browse through a wide selection of second-hand items and contribute to sustainable living
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <div className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for items..."
                  className="w-full px-5 py-3 pl-12 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 border-0 bg-white"
                />
                <HiSearch className="absolute left-4 top-3.5 text-gray-400 text-xl" />
              </div>
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-r-lg font-medium transition duration-300"
              >
                Search
              </button>
              <button 
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="ml-2 bg-green-700 hover:bg-green-800 text-white p-3 rounded-lg transition duration-300 flex items-center"
                aria-label="Filter"
              >
                <HiFilter className="text-xl" />
              </button>
            </div>
            
            {/* Filter dropdown */}
            {isFilterOpen && (
              <div className="absolute mt-2 p-4 bg-white rounded-lg shadow-lg w-full z-10">
                <h3 className="font-medium text-gray-700 mb-2">Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PRODUCT_CATEGORIES.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsFilterOpen(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-md transition ${
                        selectedCategory === category
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory === "All Items" ? "Available Items" : selectedCategory}
          </h2>
          <div className="text-sm text-gray-500">
            Showing {products.length} items
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error: {error}</p>
            <button 
              onClick={fetchProducts} 
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map(product => (
                <div key={product.item_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    {getImageUrl(product.image_url) ? (
                      <img 
                        src={getImageUrl(product.image_url)} 
                        alt={product.item_name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
                  <div className="p-4 flex flex-col flex-grow">
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full self-start">
                      {product.category || 'Uncategorized'}
                    </span>
                    <h3 className="text-lg font-medium text-gray-800 mt-2 flex-grow">{product.item_name}</h3>
                    <p className="text-green-700 font-bold mt-1">{formatPrice(product.price)}</p>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <span>Condition: {product.condition}</span>
                    </div>
                    {product.user && (
                      <div className="text-xs text-gray-500 mt-1">
                        Seller: {product.user.name || 'Unknown'}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-center">
                      <Link 
                        to={`/details/${product.item_id}`} 
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-600">No items found matching your search.</p>
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Items");
                    fetchProducts();
                  }}
                  className="mt-4 text-green-600 hover:text-green-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
