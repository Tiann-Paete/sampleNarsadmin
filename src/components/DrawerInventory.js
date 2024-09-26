import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageModal from './ImageModal';
import ProductModal from './ProductModal';
import { motion, AnimatePresence } from 'framer-motion';

const DrawerInventory = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [totalStock, setTotalStock] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchProducts(currentPage);
    fetchTotalStock();
  }, [currentPage]);

  const fetchProducts = async (page) => {
    try {
      const response = await axios.get(`/api/products?page=${page}&limit=10`);
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchTotalStock = async () => {
    try {
      const response = await axios.get('/api/total-stock');
      setTotalStock(response.data.totalStock);
    } catch (error) {
      console.error('Error fetching total stock:', error);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (currentProduct.id) {
      await handleUpdateProduct();
    } else {
      await handleAddProduct();
    }
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async () => {
    try {
      await axios.post('/api/products', currentProduct);
      fetchProducts(currentPage);
      fetchTotalStock();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      await axios.put(`/api/products/${currentProduct.id}`, currentProduct);
      fetchProducts(currentPage);
      fetchTotalStock();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`);
      fetchProducts(currentPage);
      fetchTotalStock();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const pageNumbers = [];
    let startPage, endPage;

    if (totalPages <= 5) {
      // Less than 5 total pages so show all
      startPage = 1;
      endPage = totalPages;
    } else {
      // More than 5 total pages so calculate start and end pages
      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage + 2 >= totalPages) {
        startPage = totalPages - 4;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded shadow-lg ${
            currentPage === i ? 'bg-orange-500 text-white' : 'text-black bg-white hover:bg-orange-100'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 mx-1 text-black shadow-lg rounded bg-white hover:bg-orange-100 disabled:opacity-50"
        >
          &lt;
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 mx-1 rounded shadow-lg text-black bg-white hover:bg-orange-100"
            >
              1
            </button>
            {startPage > 2 && <span className="mx-1">...</span>}
          </>
        )}
        
        {pageNumbers}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="mx-1">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1 mx-1 rounded shadow-lg text-black bg-white hover:bg-orange-100"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 mx-1 text-black shadow-lg rounded bg-white hover:bg-orange-100 disabled:opacity-50"
        >
          &gt;
        </button>
        
        <span className="ml-4 text-gray-600">
          {totalItems} items | Page {currentPage} of {totalPages}
        </span>
      </div>
    );
  };

  return (
    <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="container mx-auto p-4"
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl text-neutral-900 font-bold">
        Inventory Management 
        <span className="text-gray-500 text-base ml-2">({totalStock} stocks)</span>
      </h2>
      <button 
        onClick={() => {
          setCurrentProduct({
            name: '',
            description: '',
            price: '',
            image_url: '',
            stock_quantity: '',
            category: '',
            supplier_id: '',
            rating: 0,
          });
          setIsModalOpen(true);
        }}
        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Product
      </button>
    </div>
    
    <motion.table 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full border-collapse border"
    >
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-gray-500">Inventory ID</th>
            <th className="border p-2 text-gray-500">Image</th>
            <th className="border p-2 text-gray-500">Name</th>
            <th className="border p-2 text-gray-500">Description</th>
            <th className="border p-2 text-gray-500">Price</th>
            <th className="border p-2 text-gray-500">Stock</th>
            <th className="border p-2 text-gray-500">Category</th>
            <th className="border p-2 text-gray-500">Supplier ID</th>
            <th className="border p-2 text-gray-500">Order ID</th>
            <th className="border p-2 text-gray-500">Rating</th>
            <th className="border p-2 text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
        <AnimatePresence>
          {products.map((product) => (
            <motion.tr 
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border bg-gray-50"
            >
              <td className="border p-2 text-gray-500">{product.id}</td>
              <td className="border p-2 text-gray-500">
                {product.image_url && (
                  <img 
                    src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:8001${product.image_url}`} 
                    alt={product.name} 
                    className="w-12 h-12 object-cover cursor-pointer"
                    onClick={() => handleImageClick(product.image_url.startsWith('http') ? product.image_url : `http://localhost:8001${product.image_url}`)}
                  />
                )}
              </td>
              <td className="border p-2 text-gray-500">{product.name}</td>
              <td className="border p-2 text-gray-500">{product.description}</td>
              <td className="border p-2 text-gray-500">₱{product.price}</td>
              <td className="border p-2 text-gray-500">{product.stock_quantity}</td>
              <td className="border p-2 text-gray-500">{product.category}</td>
              <td className="border p-2 text-gray-500">{product.supplier_id}</td>
              <td className="border p-2 text-gray-500">{product.order_id}</td>
              <td className="border p-2 text-gray-500">{product.rating}</td>
              <td className="border p-2 text-gray-500">
  <div className="flex items-center justify-center space-x-2">
    <button 
      onClick={() => handleEditProduct(product)} 
      className="p-1 text-neutral-700 hover:text-neutral-800"
      title="Update"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    </button>
    <button 
      onClick={() => handleDeleteProduct(product.id)} 
      className="p-1 text-red-500 hover:text-red-600"
      title="Delete"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
</td>
</motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </motion.table>
    
    {renderPagination()}
      
      <AnimatePresence>
        {selectedImage && (
          <ImageModal 
            imageUrl={selectedImage} 
            altText="Product Image"
            onClose={closeImageModal}
          />
        )}
      </AnimatePresence>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentProduct(null);
        }}
        product={currentProduct || {}}
        onSubmit={handleModalSubmit}
        onChange={handleModalChange}
      />
    </motion.div>
  );
}

export default DrawerInventory;