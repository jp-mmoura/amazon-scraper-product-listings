const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;// Set the server port (default to 3000)

// Rate limiting middleware (maximum 10 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // Max requests per minute
});

app.use(limiter); // Applying rate-limiting middleware to all routes

// Defining a GET endpoint for scraping Amazon
app.get('/api/scrape', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ message: 'Keyword is required' });
  }

  try { // Try to execute the scraping logic
    const response = await axios.get(`https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`);
    const dom = new JSDOM(response.data);
    const { document } = dom.window;

    const products = [];// Initializing an array to store scraped product data

    // Iterating through each product item in the Amazon search results
    const productItems = document.querySelectorAll('.s-result-item');
    productItems.forEach((productItem) => {
      const titleElement = productItem.querySelector('.a-text-normal'); // to find the title element
      const title = titleElement ? titleElement.textContent.trim() : ''; // Extract and clean the title text

      const ratingElement = productItem.querySelector('.a-icon-alt');
      const rating = ratingElement
        ? parseFloat(ratingElement.textContent.replace('out of 5 stars', ''))
        : null; // Set rating to null if not found

      const reviewCountElement = productItem.querySelector('.a-size-base');
      const reviewCount = reviewCountElement  // Extract the review count as a number
        ? reviewCountElement.textContent.replace(/\D/g, '') 
        : null; // Set review count to null if not found

      const imageElement = productItem.querySelector('.s-image');
      const imageUrl = imageElement ? imageElement.src : null;
     // Pushing the scraped product data into the products array
      products.push({ title, rating, reviewCount, imageUrl });
    });

    res.json(products); // Responding with the scraped product data as JSON
  } catch (error) { // to catch and handle errors that occur during scraping
    console.error(error);
    res.status(500).json({ message: 'Error scraping Amazon' }); 
  }
});// Respond with 500 status and error message


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Message indicating that the server is running