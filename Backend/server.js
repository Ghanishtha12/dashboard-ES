import express from "express";
import cors from "cors";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Elasticsearch index name
const indexName = "products"; 

// Connect Elasticsearch
const client = new Client({
    cloud:{
        id: process.env.ELASTIC_CLOUD_ID,
    },
    auth:{
        apiKey: process.env.ELASTIC_API_KEY,
    },
 
 });

 // Ensure index exists
const ensureIndex = async () => {
  const exists = await client.indices.exists({ index: indexName });
  if (!exists) {
    await client.indices.create({
      index: indexName,
      mappings: {
        properties: {
          name: { type: "text" },
          price: { type: "float" },
        },
      },
    });
    console.log(`✅ Index "${indexName}" created`);
  }
};

 // Root route
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Fetch products from Elasticsearch
app.get("/products", async (req, res) => {
  try {
    const result = await client.search({
      index: indexName,
      query: {match_all: {}},
      size: 100,
    });

      // Include _id along with _source
    const products = result.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source
    }));

    res.json(products);

  }catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

// Search products by name
app.get("/products/search", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).send("Please provide a 'name' query parameter");

    const result = await client.search({
      index: indexName,
      query: {
        match: {
          name: {
            query: name,
            fuzziness: "AUTO",
          },
        },
      },
    });

    res.json(
      result.hits.hits.map((hit) => ({
        _id: hit._id,
        ...hit._source,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching products");
  }
});

// Add product
app.post("/products/add", async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || !price) return res.status(400).send("Please provide both name and price");

    // Prevent duplicates
    const existing = await client.search({
      index: indexName,
      query: {
        bool: {
          must: [
            { match: { name } },
            { match: { price } },
          ],
        },
      },
    });

    if (existing.hits.total.value > 0) {
      return res.status(400).json({ message: "Duplicate product not allowed" });
    }

    const result = await client.index({
      index: indexName,
      document: { name, price },
      refresh: true,
    });

    res.json({ message: "Product added successfully", _id: result._id, name, price });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding product");
  }
});

// Delete product
app.delete("/products/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await client.delete({
      index: indexName,
      id,
      refresh: true,
    });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err.meta?.body || err);
    if (err.meta?.statusCode === 404) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).send("Error deleting product");
  }
});

// Update product
app.put("/products/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    const response = await client.update({
      index: indexName,
      id,
      doc: { name, price },
      refresh: true,
    });

    res.json({ message: "Product updated", response });
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ error: "Error updating product" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));