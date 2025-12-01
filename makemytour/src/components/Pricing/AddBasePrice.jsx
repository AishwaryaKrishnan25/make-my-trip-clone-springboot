import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "https://make-my-trip-clone-springboot-gb7g.onrender.com";

/**
 * AddBasePrice
 *
 * Admin-style component that:
 *  - Shows current & base price
 *  - Lets admin update base price
 *  - Lets admin freeze price
 *  - Shows cleaned, sorted, limited price history as bars
 */
const AddBasePrice = ({ flightId }) => {
  const [basePrice, setBasePrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [freezeUntil, setFreezeUntil] = useState(null);
  const [freezeMinutes, setFreezeMinutes] = useState(30);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ---------------------------------------------------
  // Fetch current price/base price/freeze status
  // ---------------------------------------------------
  const fetchPriceDetails = async () => {
    try {
      setError("");
      const res = await axios.get(
        `${API_BASE_URL}/pricing/flight/${flightId}/price`
      );
      const data = res.data;
      setCurrentPrice(data.currentPrice ?? "");
      setBasePrice(data.basePrice ?? "");
      setFreezeUntil(data.priceFreezeUntil || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load current price");
    }
  };

  // ---------------------------------------------------
  // Fetch history from backend
  // ---------------------------------------------------
  const fetchHistory = async () => {
    try {
      setError("");
      const res = await axios.get(
        `${API_BASE_URL}/pricing/flight/${flightId}/history`
      );
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load price history");
    }
  };

  useEffect(() => {
    if (!flightId) return;
    fetchPriceDetails();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightId]);

  // ---------------------------------------------------
  // Update base price
  // ---------------------------------------------------
  const handleSubmitBasePrice = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!basePrice || isNaN(parseFloat(basePrice))) {
      setError("Please enter a valid base price.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE_URL}/pricing/flight/${flightId}/setBasePrice`,
        { basePrice: parseFloat(basePrice) }
      );
      const updated = res.data;
      setMessage("Base price updated successfully.");
      setCurrentPrice(updated.currentPrice ?? basePrice);
      await fetchHistory();
    } catch (err) {
      console.error(err);
      setError("Failed to update base price.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // Apply freeze
  // ---------------------------------------------------
  const handleFreeze = async () => {
    setMessage("");
    setError("");

    if (!freezeMinutes || isNaN(parseInt(freezeMinutes, 10))) {
      setError("Please enter valid freeze minutes.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE_URL}/pricing/flight/${flightId}/freeze`,
        { minutes: parseInt(freezeMinutes, 10) }
      );
      const data = res.data;
      setMessage(
        `Price frozen for ${freezeMinutes} minutes. Current price: ₹${data.currentPrice}`
      );
      setFreezeUntil(data.freezeUntil || null);
      // No history logged on freeze now – history is cleaner
    } catch (err) {
      console.error(err);
      setError("Failed to freeze price.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // History visualization (cleaned)
  //
  // - Sort by timestamp (ascending)
  // - Show only last 20 entries
  // - Bar width proportional to price
  // ---------------------------------------------------
  const historySorted = useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [history]);

  const displayHistory = useMemo(() => {
    if (!historySorted || historySorted.length === 0) return [];
    const maxItems = 20;
    return historySorted.slice(
      Math.max(0, historySorted.length - maxItems),
      historySorted.length
    );
  }, [historySorted]);

  const maxPrice = useMemo(() => {
    if (!displayHistory || displayHistory.length === 0) return 0;
    return displayHistory.reduce(
      (max, h) => (h.price > max ? h.price : max),
      displayHistory[0].price
    );
  }, [displayHistory]);

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Dynamic Pricing – Admin Controls</h3>

      <p style={{ fontSize: "12px", marginBottom: "10px" }}>
        This section is for <strong>ADMIN</strong> only: update base price, freeze
        price temporarily, and view the historical price changes applied by the
        dynamic pricing engine.
      </p>

      {/* Current + Base + Freeze info */}
      <div style={styles.block}>
        <p>
          <strong>Current price:</strong>{" "}
          {currentPrice !== "" ? `₹${currentPrice}` : "Loading..."}
        </p>
        <p>
          <strong>Base price:</strong>{" "}
          {basePrice !== "" ? `₹${basePrice}` : "Not set"}
        </p>
        {freezeUntil && (
          <p style={{ color: "#d9534f", fontSize: "13px" }}>
            <strong>Price frozen until:</strong>{" "}
            {new Date(freezeUntil).toLocaleString()}
          </p>
        )}
      </div>

      {/* Base price form */}
      <form onSubmit={handleSubmitBasePrice} style={styles.form}>
        <label style={styles.label}>
          Set Base Price (₹):
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            style={styles.input}
          />
        </label>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Saving..." : "Save Base Price"}
        </button>
      </form>

      {/* Freeze controls */}
      <div style={{ ...styles.block, marginTop: "20px" }}>
        <h4>Price Freeze (limited time)</h4>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <label style={styles.label}>
            Duration (minutes):
            <input
              type="number"
              min="1"
              value={freezeMinutes}
              onChange={(e) => setFreezeMinutes(e.target.value)}
              style={{ ...styles.input, width: "100px" }}
            />
          </label>
          <button
            type="button"
            style={styles.buttonSecondary}
            onClick={handleFreeze}
            disabled={loading}
          >
            {loading ? "Applying..." : "Freeze Price"}
          </button>
        </div>
      </div>

      {/* Price History Graph-like */}
      <div style={{ marginTop: "20px" }}>
        <h4>Price History (last {displayHistory.length} changes)</h4>
        {displayHistory.length === 0 && (
          <p style={{ fontSize: "12px" }}>
            No recorded price changes yet. After the engine starts adjusting
            prices or you update base price, history will appear here.
          </p>
        )}

        {displayHistory.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            {displayHistory.map((h) => {
              const widthPercent =
                maxPrice > 0 ? (h.price / maxPrice) * 100 : 0;
              return (
                <div
                  key={h.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                  title={h.reason || ""}
                >
                  <span style={{ width: "150px", fontSize: "11px" }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#eee",
                      height: "8px",
                      marginLeft: "8px",
                      borderRadius: "4px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${widthPercent}%`,
                        backgroundColor: "#007bff",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "11px",
                      minWidth: "60px",
                      textAlign: "right",
                    }}
                  >
                    ₹{h.price.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
};

const styles = {
  container: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "16px",
    backgroundColor: "#fafafa",
    maxWidth: "650px",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  block: {
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  form: {
    marginTop: "10px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  label: {
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "6px 8px",
    marginTop: "4px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  buttonSecondary: {
    padding: "8px 16px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  message: {
    marginTop: "10px",
    fontWeight: "bold",
    color: "#28a745",
  },
  error: {
    marginTop: "10px",
    fontWeight: "bold",
    color: "#d9534f",
  },
};

export default AddBasePrice;
