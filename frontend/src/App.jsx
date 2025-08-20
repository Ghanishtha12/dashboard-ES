import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const App = () => {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const fetchProducts = () => {
    axios.get("http://localhost:5000/products")
      .then((res) => {
        const productsWithId = res.data.map(hit => ({
          _id: hit._id,
          id: hit.id,
          name: hit.name,
          price: hit.price
        }));
        setData(productsWithId);
      })
      .catch((err) => console.error("Error fetching data:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

    // Search products by name
  const handleSearch = async () => {
    if (!search) {
      fetchProducts(); // if search empty, show all
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/products/search?name=${search}`);
      const productsWithId = res.data.map(hit => ({
        _id: hit._id,
        id: hit.id,
        name: hit.name,
        price: hit.price
      }));
      setData(productsWithId);
    } catch (err) {
      console.error("Error searching products:", err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price) return alert("Please fill all fields");

    try {
      await axios.post("http://localhost:5000/products/add", { name, price: Number(price) });
      setName("");
      setPrice("");
      fetchProducts();
    } catch (err) {
      if (err.response && err.response.data?.message) {
        alert(err.response.data.message);
      } else {
        console.error("Error adding product:", err);
      }
    }
  };

  const handleDelete = async (_id) => {
    try {
      await axios.delete(`http://localhost:5000/products/delete/${_id}`);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleEditClick = (product) => {
    setEditId(product._id);
    setEditName(product.name);
    setEditPrice(product.price);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName || !editPrice) return alert("Please fill all fields");

    try {
      await axios.put(`http://localhost:5000/products/update/${editId}`, {
        name: editName,
        price: Number(editPrice),
      });
      setEditId(null);
      setEditName("");
      setEditPrice("");
      fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Error updating product");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 p-6">
      <h1 className="text-3xl font-extrabold text-center mb-8 text-purple-800">Products Dashboard</h1>

  {/* Search bar */}
      <div className="flex justify-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded w-64"
        />
        <button
          onClick={handleSearch}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
        <button
          onClick={() => { setSearch(""); fetchProducts(); }}
          className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          Reset
        </button>
      </div>

      {/* Add Product Form */}
      <form 
        onSubmit={handleAddProduct} 
        className="mb-8 flex flex-col sm:flex-row justify-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-md max-w-3xl mx-auto"
      >
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none flex-1"
        />
        <input
          type="number"
          placeholder="Product Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none w-32"
        />
        <button 
          type="submit" 
          className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-105 hover:shadow-lg transition-transform duration-200"
        >
          Add Product
        </button>
      </form>

      {/* Chart */}
      <div className="w-full h-96 mb-10 bg-white/70 backdrop-blur-md rounded-xl shadow-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis dataKey="name" stroke="#6b21a8" />
            <YAxis stroke="#6b21a8" />
            <Tooltip />
            <Legend />
            <Bar dataKey="price" fill="#9333ea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product List */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4 text-purple-700">Product List</h2>
        <ul className="space-y-3">
          {data.map((product) => (
            <li key={product._id} className="flex justify-between items-center p-4 bg-white/70 backdrop-blur-md rounded-xl shadow hover:shadow-lg transition">
              {editId === product._id ? (
                <form onSubmit={handleUpdate} className="flex gap-2 w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg flex-1 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-24 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 hover:shadow-lg transition-transform duration-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 hover:scale-105 hover:shadow-lg transition-transform duration-200"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="font-medium text-purple-900">{product.name} - <span className="font-bold">${product.price}</span></span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 hover:scale-105 hover:shadow-lg transition-transform duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-105 hover:shadow-lg transition-transform duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
