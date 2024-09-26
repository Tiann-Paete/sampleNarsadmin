import React from 'react';
import { motion } from 'framer-motion';

const ProductModal = ({ isOpen, onClose, product, onSubmit, onChange }) => {
  if (!isOpen) return null;

  const isEditing = !!product.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-6 rounded-lg w-full max-w-2xl"
      >
        <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={onSubmit} className="space-y-4 text-black">
          <div className="grid grid-cols-2 gap-4">
            <input name="name" value={product.name} onChange={onChange} placeholder="Name" required className="p-2 border rounded outline-orange-300" />
            <input name="description" value={product.description} onChange={onChange} placeholder="Description" required className="p-2 border rounded outline-orange-300" />
            <input name="price" type="number" value={product.price} onChange={onChange} placeholder="Price" required className="p-2 border rounded outline-orange-300" />
            <input name="image_url" value={product.image_url} onChange={onChange} placeholder="Image URL" className="p-2 border rounded outline-orange-300" />
            <input name="stock_quantity" type="number" value={product.stock_quantity} onChange={onChange} placeholder="Stock Quantity" required className="p-2 border rounded outline-orange-300" />
            <input name="category" value={product.category} onChange={onChange} placeholder="Category" className="p-2 border rounded outline-orange-300" />
            <input name="supplier_id" value={product.supplier_id} onChange={onChange} placeholder="Supplier ID" required className="p-2 border rounded outline-orange-300" />
            <input 
              name="rating" 
              type="number" 
              min="0" 
              max="5" 
              step="0.1" 
              value={product.rating} 
              onChange={onChange} 
              placeholder="Rating" 
              className="p-2 border rounded outline-orange-300"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">{isEditing ? 'Update' : 'Add'} Product</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductModal;