import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  HiOutlinePlus,
  HiPencil,
  HiTrash,
  HiPhotograph,
  HiX,
} from "react-icons/hi";

// API URL
const API_BASE_URL = "https://givetzy-backend-469569820136.us-central1.run.app";

// Product categories
const PRODUCT_CATEGORIES = [
  "Furniture",
  "Electronics",
  "Clothing",
  "Books",
  "Kitchenware",
  "Toys",
  "Sports",
  "Other",
];

// Product conditions
const PRODUCT_CONDITIONS = ["Like New", "Good", "Fair", "Poor"];

const ManageProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, available, sold
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    condition: "",
    description: "",
    // images: [], // Removed image state
    // imageFile: null, // Removed image file state
  });

  useEffect(() => {
    fetchProducts();
  }, [filterStatus]);
  

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fix: Use correct API endpoint for getting user's products
      let url = `${API_BASE_URL}/api/my-barang`;
      if (filterStatus !== "all") {
        url += `?status=${filterStatus}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Format price to Rupiah
  const formatPrice = (price) => {
    return `Rp ${parseInt(price).toLocaleString("id-ID")}`;
  };

  // Filter products based on status
  const filteredProducts = products.filter((product) => {
    if (filterStatus === "all") return true;
    return product.status === filterStatus;
  });

  // Handle input change for new product form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit new product
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Simple validation
      if (
        !newProduct.name ||
        !newProduct.category ||
        !newProduct.price ||
        !newProduct.condition
      ) {
        alert("Please fill in all required fields.");
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const payload = {
        item_name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        condition: newProduct.condition,
        description: newProduct.description || "",
        status: "available",
        // image_url will be handled by backend if it expects a URL, or removed if not needed
      };

      const response = await fetch(`${API_BASE_URL}/api/barang`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // Added for JSON payload
        },
        body: JSON.stringify(payload), // Send as JSON
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to create product");
      }

      setNewProduct({
        name: "",
        category: "",
        price: "",
        condition: "",
        description: "",
        // images: [], // Removed
        // imageFile: null, // Removed
      });
      setShowAddModal(false);
      fetchProducts();
    } catch (error) {
      console.error("Error creating product:", error);
      alert(error.message);
    }
  };

  // Handle product status change
  const toggleProductStatus = async (id) => {
    try {
      const product = products.find((p) => p.item_id === id);
      if (!product) return;

      const newStatus = product.status === "available" ? "sold" : "available";

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/api/barang/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to update product status");
      }

      // Update local state
      setProducts(
        products.map((product) => {
          if (product.item_id === id) {
            return { ...product, status: newStatus };
          }
          return product;
        })
      );
    } catch (error) {
      console.error("Error updating product status:", error);
      alert(error.message);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/api/barang/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to delete product");
      }

      // Update local state
      setProducts(products.filter((product) => product.item_id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.message);
    }
  };

  // Handle edit product button click
  const handleEditClick = (product) => {
    setEditingProduct({
      ...product,
      item_id: product.item_id,
      name: product.item_name,
      price: product.price.toString(),
      // images: product.image_url ? [product.image_url] : [], // Removed image state for edit
      // imageFile: null, // Removed image file state for edit
    });
    setShowEditModal(true);
  };

  // Handle input change for edit product form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit edited product
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const payload = {
        item_name: editingProduct.name,
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        condition: editingProduct.condition,
        description: editingProduct.description || "",
        status: editingProduct.status || "available",
        // image_url will be handled by backend if it expects a URL, or removed if not needed
      };

      const response = await fetch(
        `${API_BASE_URL}/api/barang/${editingProduct.item_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Added for JSON payload
          },
          body: JSON.stringify(payload), // Send as JSON
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to update product");
      }

      setShowEditModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Kelola Barang
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 flex items-center"
          >
            <HiOutlinePlus className="mr-2" /> Tambah Barang Baru
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              filterStatus === "all"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFilterStatus("all")}
          >
            Semua
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              filterStatus === "available"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFilterStatus("available")}
          >
            Tersedia
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              filterStatus === "sold"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFilterStatus("sold")}
          >
            Terjual
          </button>
        </div>

        {/* Products Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <button
            onClick={fetchProducts}
            className="bg-green-600 text-white px-4 py-2 rounded-md"
                >
            Try Again
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Produk
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Harga
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tanggal
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.item_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 mr-3 bg-gray-200 rounded-md overflow-hidden">
                    {product.image_url ? (
                <img
                  className="h-10 w-10 object-cover transition-opacity duration-300"
                  src={`${API_BASE_URL}${product.image_url}`}
                  alt={product.item_name}
                  onLoad={(e) => e.target.classList.remove('opacity-0')}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/40?text=No+Image";
                  }}
                  style={{ opacity: 0 }}
                />
                    ) : (
                <div className="h-10 w-10 flex items-center justify-center text-gray-500 text-xs">
                  No Image
                </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                {product.item_name}
                    </div>
                    <div className="text-sm text-gray-500">
                {product.category}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-medium">
                  {formatPrice(product.price)}
                </div>
                <div className="text-sm text-gray-500">
                  {product.condition}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.status === "available"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {product.status === "available"
                    ? "Tersedia"
                    : "Terjual"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(product.date_posted).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => toggleProductStatus(product.item_id)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  {product.status === "available"
                    ? "Tandai Terjual"
                    : "Tandai Tersedia"}
                </button>
                <button
                  onClick={() => handleEditClick(product)}
                  className="text-green-600 hover:text-green-900 mr-3"
                  title="Edit"
                >
                  <HiPencil />
                </button>
                <button
                  onClick={() =>
                    setShowDeleteConfirm(product.item_id)
                  }
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <HiTrash />
                </button>
              </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
              colSpan="6"
              className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500"
                  >
              Tidak ada barang yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
                </table>
              </div>
            )}
          </div>
              </div>

              {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Tambah Barang Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Kursi Kayu Antik"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Harga (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder="Contoh: 250000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="condition"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Kondisi <span className="text-red-500">*</span>
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={newProduct.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Pilih Kondisi</option>
                  {PRODUCT_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Deskripsi Barang
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsikan barang anda secara detail..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                ></textarea>
              </div>

              {/* Remove image upload section
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Barang
                </label>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  {newProduct.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative h-24 bg-gray-100 rounded-md overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                        title="Remove image"
                      >
                        <HiX />
                      </button>
                    </div>
                  ))}

                  {newProduct.images.length < 1 && ( // Allow only one image based on backend single upload
                    <label className="h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        // multiple // Remove multiple if backend handles single
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <HiPhotograph className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 text-center mt-1">
                          Tambah Foto
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Anda dapat mengunggah 1 foto. Format: JPG, PNG. Ukuran
                  maksimum: 5MB.
                </p>
              </div>
              */}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Tambah Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Edit Barang</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editingProduct.name}
                  onChange={handleEditInputChange}
                  placeholder="Contoh: Kursi Kayu Antik"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="edit-category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    value={editingProduct.category}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Harga (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-price"
                    name="price"
                    value={editingProduct.price}
                    onChange={handleEditInputChange}
                    placeholder="Contoh: 250000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="edit-condition"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Kondisi <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-condition"
                  name="condition"
                  value={editingProduct.condition}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Pilih Kondisi</option>
                  {PRODUCT_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Deskripsi Barang
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editingProduct.description}
                  onChange={handleEditInputChange}
                  placeholder="Deskripsikan barang anda secara detail..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                ></textarea>
              </div>

              {/* Remove image upload section
              <div className="mb-4">
                <label
                  htmlFor="editImages"
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Image
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    id="editImages"
                    name="images"
                    accept="image/*"
                    onChange={handleEditImageUpload} // This function is now removed
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                </div>
                {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="mt-2 relative w-32 h-32">
                    <img src={editingProduct.images[0]} alt="Preview" className="w-full h-full object-cover rounded" />
                    <button
                      onClick={() => removeEditImage(0)} // This function is now removed
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      <HiX />
                    </button>
                  </div>
                )}
              </div>
              */}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteProduct(showDeleteConfirm)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProductsPage;
