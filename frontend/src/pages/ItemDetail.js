import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use full URL in development, relative in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        const baseUrl = isDevelopment ? 'http://localhost:3001' : '';
        const apiUrl = `${baseUrl}/api/items/${id}`;

        const response = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        // Check if the response is HTML (which would indicate a 404 page or server error)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Invalid response format: ${text.substring(0, 100)}...`);
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch item');
        }

        setItem(data);
      } catch (err) {
        console.error('Error fetching item:', err);
        setError(err.message || 'Failed to load item. Please try again later.');
        // Only redirect if it's a 404 error
        if (err.message.includes('404') || err.message.includes('not found')) {
          setTimeout(() => navigate('/'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    } else {
      setError('No item ID provided');
      setLoading(false);
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}. Redirecting to home page...</p>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="item-detail-container">
      <Link to="/" className="back-button">
        &larr; Back to Items
      </Link>

      <div className="item-detail-card">
        <div className="item-header">
          <h1 className="item-title">{item.name}</h1>
          <span className="item-category">{item.category}</span>
          <p className="item-price">${item.price.toFixed(2)}</p>
        </div>
      </div>
    </div >
  );
}

export default ItemDetail;