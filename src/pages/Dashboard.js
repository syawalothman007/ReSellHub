import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getCategoryOptions, getProductCategory } from "../utils/categories";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement);

function Dashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(data);
    };

    fetchProducts();
  }, []);

  // 🔹 CONSTANTS
  const emissionFactor = {
    plastic: 6.0,
    iron: 1.9,
    wood: 0.5,
    glass: 1.2,
    fabric: 2.5,
    rubber: 3.0,
    leather: 17.0
  };

  // 🔹 BASIC CALCULATIONS
  const totalProducts = products.length;

  const totalValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0),
    0
  );

  const wasteReduced = totalProducts * 0.5;

  const co2Saved = products.reduce((sum, p) => {
    const material = (p.material || "").toLowerCase();
    const factor = emissionFactor[material] || 0;
    return sum + (Number(p.weight) || 0) * factor;
  }, 0);

  // 🔹 CATEGORY MAP
  const categoryMap = {};
  products.forEach((p) => {
    const cat = getProductCategory(p);
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryLabels = getCategoryOptions(Object.keys(categoryMap)).filter(
    (category) => categoryMap[category]
  );
  const categoryCounts = categoryLabels.map((category) => categoryMap[category]);
  const categoryWasteData = categoryCounts.map((count) => count * 0.5);

  // 🔹 CATEGORY PRICE MAP (NEW FEATURE)
  const categoryPriceMap = {};
  products.forEach((p) => {
    const cat = getProductCategory(p);
    const price = Number(p.price) || 0;

    if (!categoryPriceMap[cat]) {
      categoryPriceMap[cat] = { total: 0, count: 0 };
    }

    categoryPriceMap[cat].total += price;
    categoryPriceMap[cat].count += 1;
  });

  const sortedAvg = Object.entries(categoryPriceMap)
    .map(([cat, data]) => ({
      cat,
      avg: data.count ? data.total / data.count : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  const avgPriceLabels = sortedAvg.map(item => item.cat);
  const avgPriceData = sortedAvg.map(item => item.avg);

  // 🔹 CHART DATA
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        label: "Waste Saved (kg)",
        data: categoryWasteData,
        backgroundColor: "#66bb6a",
      },
    ],
  };

  const pieData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryCounts,
        backgroundColor: [
          "#66bb6a",
          "#81c784",
          "#a5d6a7",
          "#c8e6c9",
        ],
      },
    ],
  };

  // 🔥 NEW HORIZONTAL BAR
  const avgPriceChartData = {
    labels: avgPriceLabels,
    datasets: [
      {
        label: "Average Price (RM)",
        data: avgPriceData,
        backgroundColor: "#ff9800",
      },
    ],
  };

  const avgPriceOptions = {
    indexAxis: "y",
  };

  // 🔹 STYLES
  const cardStyle = {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  };

  const valueStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#2e7d32",
  };

  return (
    <div style={{ padding: "30px", background: "#f9f9f9", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: "20px", color: "#2e7d32" }}>
        Sustainability Dashboard 🌱
      </h1>

      {/* 🔹 SUMMARY */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
      }}>
        <div style={cardStyle}>
          <h3>📦 Products</h3>
          <p style={valueStyle}>{totalProducts}</p>
        </div>

        <div style={cardStyle}>
          <h3>💰 Value</h3>
          <p style={valueStyle}>RM {totalValue.toFixed(2)}</p>
        </div>

        <div style={cardStyle}>
          <h3>🌱 Waste Saved</h3>
          <p style={valueStyle}>{wasteReduced.toFixed(2)} kg</p>
        </div>

        <div style={cardStyle}>
          <h3>🌍 CO₂ Saved</h3>
          <p style={valueStyle}>{co2Saved.toFixed(2)} kg</p>
        </div>
      </div>

      {/* 🔹 EXISTING CHARTS (UNCHANGED) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "20px",
        marginBottom: "30px",
      }}>
        <div style={cardStyle}>
          <h3>Waste Reduction by Category</h3>
          <Bar data={categoryChartData} />
        </div>

        <div style={cardStyle}>
          <h3>Category Distribution</h3>
          <Doughnut data={pieData} />
        </div>
      </div>

      {/* 🔥 NEW CHART ONLY */}
      <div style={cardStyle}>
        <h3>Average Price by Category</h3>
        <Bar data={avgPriceChartData} options={avgPriceOptions} />
      </div>
    </div>
  );
}

export default Dashboard;
