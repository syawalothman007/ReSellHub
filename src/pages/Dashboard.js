import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getProductCategory } from "../utils/categories";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const emissionFactor = {
  plastic: 6.0,
  iron: 1.9,
  metal: 1.9,
  wood: 0.5,
  glass: 1.2,
  fabric: 2.5,
  rubber: 3.0,
  leather: 17.0,
};

const chartColors = [
  "#2e7d32",
  "#1976d2",
  "#f57c00",
  "#7b1fa2",
  "#00838f",
  "#c2185b",
  "#5d4037",
  "#455a64",
  "#689f38",
  "#d32f2f",
  "#512da8",
  "#00796b",
  "#9e9d24",
];

const formatNumber = (value) => Number(value || 0).toFixed(2);
const formatCurrency = (value) => `RM ${formatNumber(value)}`;
const percentage = (part, total) => (total ? (part / total) * 100 : 0);
const getWeight = (product) => Number(product.weight) || 0;
const getPrice = (product) => Number(product.price) || 0;
const getMaterial = (product) => (product.material || "Unspecified").trim();
const normalizeMaterial = (material) => material.toLowerCase();

const getTopItem = (items, key) =>
  items.length ? [...items].sort((a, b) => b[key] - a[key])[0] : null;

const getBottomItem = (items, key) =>
  items.length ? [...items].sort((a, b) => a[key] - b[key])[0] : null;

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-icon">{icon}</div>
      <div>
        <p className="dashboard-stat-label">{label}</p>
        <p className="dashboard-stat-value">{value}</p>
        <p className="dashboard-stat-detail">{detail}</p>
      </div>
    </div>
  );
}

function InsightPanel({ title, metrics, observation, recommendation }) {
  return (
    <div className="dashboard-insight-card">
      <p className="dashboard-eyebrow">Insights</p>
      <h3>{title}</h3>

      <div className="dashboard-metric-list">
        {metrics.map((metric) => (
          <div key={metric.label} className="dashboard-metric-row">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-note">
        <strong>Observation</strong>
        <p>{observation}</p>
      </div>

      <div className="dashboard-note recommendation">
        <strong>Recommendation</strong>
        <p>{recommendation}</p>
      </div>
    </div>
  );
}

function AnalyticsSection({ title, subtitle, chart, insight }) {
  return (
    <section className="dashboard-analytics-section">
      <div className="dashboard-chart-card">
        <div className="dashboard-section-heading">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="dashboard-chart-wrap">{chart}</div>
      </div>
      {insight}
    </section>
  );
}

function ImpactCard({ icon, label, value, detail }) {
  return (
    <div className="dashboard-impact-card">
      <div className="dashboard-impact-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

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

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + getPrice(product), 0);
  const wasteReduced = products.reduce((sum, product) => sum + getWeight(product), 0);

  const co2Saved = products.reduce((sum, product) => {
    const material = normalizeMaterial(product.material || "");
    const factor = emissionFactor[material] || 0;
    return sum + getWeight(product) * factor;
  }, 0);

  const DASHBOARD_CATEGORIES = [
    "Electronics",
    "Fashion",
    "Home & Living",
    "Sports & Outdoors",
    "Books & Education",
    "Automotive",
    "Hobbies & Collectibles",
    "Others",
  ];

  const categoryStatsMap = {};
  DASHBOARD_CATEGORIES.forEach((cat) => {
    categoryStatsMap[cat] = {
      name: cat,
      count: 0,
      value: 0,
      weight: 0,
    };
  });

  const materialStatsMap = {};

  products.forEach((product) => {
    const category = getProductCategory(product);
    const price = getPrice(product);
    const weight = getWeight(product);
    const material = getMaterial(product);
    const materialKey = normalizeMaterial(material);
    const co2 = weight * (emissionFactor[materialKey] || 0);

    if (!categoryStatsMap[category]) {
      categoryStatsMap[category] = {
        name: category,
        count: 0,
        value: 0,
        weight: 0,
      };
    }

    categoryStatsMap[category].count += 1;
    categoryStatsMap[category].value += price;
    categoryStatsMap[category].weight += weight;

    if (!materialStatsMap[material]) {
      materialStatsMap[material] = {
        name: material,
        count: 0,
        weight: 0,
        co2: 0,
      };
    }

    materialStatsMap[material].count += 1;
    materialStatsMap[material].weight += weight;
    materialStatsMap[material].co2 += co2;
  });

  const categoryLabels = DASHBOARD_CATEGORIES;
  const categoryStats = DASHBOARD_CATEGORIES.map((category) => categoryStatsMap[category]);
  const priceStats = categoryStats
    .map((category) => ({
      ...category,
      averagePrice: category.count ? category.value / category.count : 0,
    }))
    .sort((a, b) => b.averagePrice - a.averagePrice);
  const wasteStats = [...categoryStats].sort((a, b) => b.weight - a.weight);
  const materialStats = Object.values(materialStatsMap).sort((a, b) => b.co2 - a.co2);
  const topCategories = [...categoryStats].sort((a, b) => b.count - a.count).slice(0, 5);

  const mostPopularCategory = getTopItem(categoryStats, "count");
  const leastPopularCategory = getBottomItem(categoryStats, "count");
  const highestAveragePriceCategory = getTopItem(priceStats, "averagePrice");
  const lowestAveragePriceCategory = getBottomItem(priceStats, "averagePrice");
  const largestWasteCategory = getTopItem(wasteStats, "weight");
  const largestCo2Material = getTopItem(materialStats, "co2");

  const topCategoryShare = percentage(mostPopularCategory?.count, totalProducts);
  const averagePriceDifference =
    (highestAveragePriceCategory?.averagePrice || 0) -
    (lowestAveragePriceCategory?.averagePrice || 0);

  const treesEquivalent = Math.floor(co2Saved / 21);
  const drivingAvoidedKm = co2Saved / 0.21;
  const electricityHoursSaved = co2Saved / 0.4;

  const sharedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 14,
          color: "#425049",
        },
      },
      tooltip: {
        backgroundColor: "#1f2d28",
        padding: 12,
      },
    },
  };

  const horizontalBarOptions = {
    ...sharedChartOptions,
    indexAxis: "y",
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "#eef3ef" },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  const verticalBarOptions = {
    ...sharedChartOptions,
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#eef3ef" },
      },
    },
  };

  const categoryDistributionData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryStats.map((category) => category.count),
        backgroundColor: chartColors,
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  };

  const averagePriceChartData = {
    labels: priceStats.map((category) => category.name),
    datasets: [
      {
        label: "Average Price (RM)",
        data: priceStats.map((category) => Number(category.averagePrice.toFixed(2))),
        backgroundColor: "#1976d2",
        borderRadius: 8,
      },
    ],
  };

  const wasteChartData = {
    labels: wasteStats.map((category) => category.name),
    datasets: [
      {
        label: "Waste Diverted (kg)",
        data: wasteStats.map((category) => Number(category.weight.toFixed(2))),
        backgroundColor: "#2e7d32",
        borderRadius: 8,
      },
    ],
  };

  const co2ChartData = {
    labels: materialStats.map((material) => material.name),
    datasets: [
      {
        label: "CO2 Saved (kg)",
        data: materialStats.map((material) => Number(material.co2.toFixed(2))),
        backgroundColor: "#00838f",
        borderRadius: 8,
      },
    ],
  };

  const marketplaceChartData = {
    labels: topCategories.map((category) => category.name),
    datasets: [
      {
        label: "Listings",
        data: topCategories.map((category) => category.count),
        backgroundColor: "#7b1fa2",
        borderRadius: 8,
      },
    ],
  };

  const hasProducts = totalProducts > 0;
  const emptyMessage = "Add product listings to generate this insight.";

  return (
    <div className="dashboard-page">
      <style>
        {`
          .dashboard-page {
            min-height: 100vh;
            padding: var(--space-xl);
            background: var(--bg-default, #f9fafb);
            color: var(--text-dark, #1f2937);
          }

          .dashboard-header {
            margin-bottom: var(--space-xl);
          }

          .dashboard-header h1 {
            margin: 0 0 var(--space-xs);
            color: var(--primary-dark);
            font-family: var(--font-title);
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .dashboard-header p {
            margin: 0;
            color: var(--text-muted);
            font-size: 1.1rem;
          }

          .dashboard-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: var(--space-lg);
            margin-bottom: var(--space-2xl);
          }

          .dashboard-stat-card,
          .dashboard-chart-card,
          .dashboard-insight-card,
          .dashboard-impact-card,
          .dashboard-findings-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            border-radius: var(--radius-lg);
          }

          .dashboard-stat-card {
            display: flex;
            align-items: flex-start;
            gap: var(--space-md);
            padding: var(--space-lg);
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
          }

          .dashboard-stat-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--primary);
            opacity: 0;
            transition: opacity var(--transition-fast);
          }

          .dashboard-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-light);
          }
          
          .dashboard-stat-card:hover::after {
            opacity: 1;
          }

          .dashboard-stat-icon,
          .dashboard-impact-icon {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-md);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 800;
            font-size: 1.25rem;
            flex: 0 0 auto;
          }

          .dashboard-stat-label,
          .dashboard-impact-card p,
          .dashboard-eyebrow {
            margin: 0;
            color: var(--text-muted);
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .dashboard-stat-value {
            margin: 8px 0 4px;
            color: var(--text-dark);
            font-size: 1.8rem;
            font-weight: 800;
            line-height: 1.2;
          }

          .dashboard-stat-detail,
          .dashboard-impact-card span {
            margin: 0;
            color: var(--text-muted);
            font-size: 0.85rem;
          }

          .dashboard-analytics-section {
            display: grid;
            grid-template-columns: minmax(0, 1.85fr) minmax(320px, 1fr);
            gap: var(--space-lg);
            margin-bottom: var(--space-2xl);
            align-items: stretch;
          }

          .dashboard-chart-card,
          .dashboard-insight-card,
          .dashboard-findings-card {
            padding: var(--space-xl);
            display: flex;
            flex-direction: column;
          }

          .dashboard-section-heading {
            margin-bottom: var(--space-lg);
          }

          .dashboard-section-heading h2,
          .dashboard-insight-card h3,
          .dashboard-findings-card h2 {
            margin: 0 0 8px;
            color: var(--text-dark);
            font-family: var(--font-title);
            font-weight: 800;
            font-size: 1.5rem;
          }

          .dashboard-section-heading p {
            margin: 0;
            color: var(--text-muted);
            font-size: 0.95rem;
          }

          .dashboard-chart-wrap {
            flex: 1;
            min-height: 350px;
            position: relative;
          }

          .dashboard-metric-list {
            display: grid;
            gap: var(--space-sm);
            margin: var(--space-lg) 0;
          }

          .dashboard-metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--space-md);
            padding-bottom: var(--space-sm);
            border-bottom: 1px solid var(--border);
            color: var(--text-muted);
            font-size: 0.95rem;
          }

          .dashboard-metric-row strong {
            color: var(--text-dark);
            font-size: 1.05rem;
            text-align: right;
          }

          .dashboard-note {
            padding: var(--space-md);
            border-radius: var(--radius-md);
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            margin-top: auto;
          }

          .dashboard-note.recommendation {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            margin-top: var(--space-md);
          }

          .dashboard-note strong {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
            color: var(--primary-dark);
            font-weight: 700;
            font-size: 0.95rem;
          }
          
          .dashboard-note.recommendation strong {
             color: #1e3a8a;
          }

          .dashboard-note p {
            margin: 0;
            color: var(--text);
            line-height: 1.6;
            font-size: 0.9rem;
          }

          .dashboard-impact-section {
            margin: var(--space-2xl) 0;
            padding: var(--space-2xl);
            border-radius: var(--radius-lg);
            background: linear-gradient(135deg, var(--primary-dark) 0%, #047857 100%);
            color: white;
            box-shadow: var(--shadow-lg);
          }

          .dashboard-impact-section h2 {
            margin: 0 0 8px;
            font-family: var(--font-title);
            font-size: 1.8rem;
          }

          .dashboard-impact-section > p {
            margin: 0 0 var(--space-xl);
            color: #d1fae5;
            font-size: 1.05rem;
          }

          .dashboard-impact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--space-lg);
          }

          .dashboard-impact-card {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: var(--space-lg);
            transition: transform var(--transition-normal);
          }
          
          .dashboard-impact-card:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.15);
          }
          
          .dashboard-impact-icon {
            background: rgba(255,255,255,0.2);
            color: white;
          }

          .dashboard-impact-card p {
            color: #d1fae5;
            margin-top: 12px;
          }

          .dashboard-impact-card strong {
            display: block;
            margin: 8px 0 4px;
            color: white;
            font-size: 1.8rem;
            font-weight: 800;
          }
          
          .dashboard-impact-card span {
             color: rgba(255,255,255,0.7);
          }

          .dashboard-findings-card {
            margin-top: var(--space-2xl);
          }

          .dashboard-findings-list {
            margin: var(--space-md) 0 0;
            padding-left: var(--space-xl);
            color: var(--text);
            line-height: 1.8;
            font-size: 1.05rem;
          }
          
          .dashboard-findings-list li {
            margin-bottom: 8px;
          }
          
          .dashboard-findings-list strong {
            color: var(--text-dark);
          }

          @media (max-width: 992px) {
            .dashboard-analytics-section {
              grid-template-columns: 1fr;
            }

            .dashboard-chart-wrap {
              min-height: 300px;
            }
          }
          
          @media (max-width: 768px) {
            .dashboard-page {
              padding: var(--space-md);
            }
            .dashboard-impact-section {
              padding: var(--space-lg);
            }
          }
        `}
      </style>

      <div className="dashboard-header">
        <h1>Sustainability Dashboard</h1>
        <p>Marketplace health, reuse impact, and sustainability recommendations.</p>
      </div>

      <div className="dashboard-summary-grid">
        <StatCard
          icon="P"
          label="Products"
          value={totalProducts}
          detail="Total active marketplace listings"
        />
        <StatCard
          icon="RM"
          label="Value"
          value={formatCurrency(totalValue)}
          detail="Combined listed marketplace value"
        />
        <StatCard
          icon="KG"
          label="Waste Saved"
          value={`${formatNumber(wasteReduced)} kg`}
          detail="Based on listed product weight"
        />
        <StatCard
          icon="CO2"
          label="CO2 Saved"
          value={`${formatNumber(co2Saved)} kg`}
          detail="Weight multiplied by material factors"
        />
      </div>

      <AnalyticsSection
        title="Category Distribution"
        subtitle="How listings are distributed across product categories."
        chart={<Doughnut data={categoryDistributionData} options={sharedChartOptions} />}
        insight={
          <InsightPanel
            title="Category demand signal"
            metrics={[
              {
                label: "Most popular",
                value: mostPopularCategory?.name || "No data",
              },
              {
                label: "Least popular",
                value: leastPopularCategory?.name || "No data",
              },
              {
                label: "Top category share",
                value: `${formatNumber(topCategoryShare)}%`,
              },
            ]}
            observation={
              hasProducts && mostPopularCategory
                ? `${mostPopularCategory.name} accounts for ${formatNumber(topCategoryShare)}% of all listings, indicating the strongest current supply in the marketplace.`
                : emptyMessage
            }
            recommendation={
              hasProducts && mostPopularCategory
                ? `Feature ${mostPopularCategory.name} in browsing and search while encouraging sellers to list under-represented categories.`
                : "Once listings exist, use this view to balance category coverage."
            }
          />
        }
      />

      <AnalyticsSection
        title="Average Price by Category"
        subtitle="Economic value by category using average listed price."
        chart={<Bar data={averagePriceChartData} options={horizontalBarOptions} />}
        insight={
          <InsightPanel
            title="Pricing intelligence"
            metrics={[
              {
                label: "Highest average",
                value: highestAveragePriceCategory
                  ? `${highestAveragePriceCategory.name} (${formatCurrency(highestAveragePriceCategory.averagePrice)})`
                  : "No data",
              },
              {
                label: "Lowest average",
                value: lowestAveragePriceCategory
                  ? `${lowestAveragePriceCategory.name} (${formatCurrency(lowestAveragePriceCategory.averagePrice)})`
                  : "No data",
              },
              {
                label: "Price gap",
                value: formatCurrency(averagePriceDifference),
              },
            ]}
            observation={
              highestAveragePriceCategory
                ? `${highestAveragePriceCategory.name} generates the highest average listing value, making it the most economically significant category.`
                : emptyMessage
            }
            recommendation={
              highestAveragePriceCategory
                ? `Use pricing guidance and quality photos for ${highestAveragePriceCategory.name} to protect buyer trust in higher-value listings.`
                : "Average price insights will appear after products are listed with prices."
            }
          />
        }
      />

      <AnalyticsSection
        title="Waste Reduction by Category"
        subtitle="Waste diverted based on actual product weights."
        chart={<Bar data={wasteChartData} options={verticalBarOptions} />}
        insight={
          <InsightPanel
            title="Reuse weight impact"
            metrics={[
              {
                label: "Largest contributor",
                value: largestWasteCategory
                  ? `${largestWasteCategory.name} (${formatNumber(largestWasteCategory.weight)} kg)`
                  : "No data",
              },
              {
                label: "Total waste diverted",
                value: `${formatNumber(wasteReduced)} kg`,
              },
            ]}
            observation={
              largestWasteCategory
                ? `${largestWasteCategory.name} contributes the most waste reduction because its listings carry the highest total product weight.`
                : emptyMessage
            }
            recommendation={
              largestWasteCategory
                ? `Encourage complete weight information in ${largestWasteCategory.name} so sustainability impact remains accurate.`
                : "Ask sellers to enter product weights to unlock reliable waste reduction analytics."
            }
          />
        }
      />

      <AnalyticsSection
        title="CO2 Savings by Material"
        subtitle="Estimated carbon savings from product weight and material emission factors."
        chart={<Bar data={co2ChartData} options={verticalBarOptions} />}
        insight={
          <InsightPanel
            title="Material impact"
            metrics={[
              {
                label: "Top material",
                value: largestCo2Material
                  ? `${largestCo2Material.name} (${formatNumber(largestCo2Material.co2)} kg CO2)`
                  : "No data",
              },
              {
                label: "Total CO2 saved",
                value: `${formatNumber(co2Saved)} kg`,
              },
            ]}
            observation={
              largestCo2Material
                ? `${largestCo2Material.name} products contribute the largest carbon savings based on their listed weights and emission factor.`
                : emptyMessage
            }
            recommendation={
              largestCo2Material
                ? `Highlight reused ${largestCo2Material.name.toLowerCase()} products in sustainability messaging because they create measurable carbon benefits.`
                : "CO2 insights improve when listings include both material type and product weight."
            }
          />
        }
      />

      <AnalyticsSection
        title="Marketplace Intelligence"
        subtitle="Top category leaderboard based on current listing volume."
        chart={<Bar data={marketplaceChartData} options={horizontalBarOptions} />}
        insight={
          <InsightPanel
            title="Marketplace trend"
            metrics={[
              {
                label: "Leading category",
                value: mostPopularCategory
                  ? `${mostPopularCategory.name} (${mostPopularCategory.count} listings)`
                  : "No data",
              },
              {
                label: "Tracked categories",
                value: categoryStats.length,
              },
            ]}
            observation={
              mostPopularCategory
                ? `${mostPopularCategory.name} is the strongest listing trend, showing where seller activity is currently concentrated.`
                : emptyMessage
            }
            recommendation={
              mostPopularCategory
                ? `Use the leaderboard to plan homepage category placement and identify categories that need seller acquisition.`
                : "Marketplace trends will become meaningful as product coverage grows."
            }
          />
        }
      />

      <section className="dashboard-impact-section">
        <h2>Sustainability Impact</h2>
        <p>Real-world equivalents based on current marketplace reuse activity.</p>
        <div className="dashboard-impact-grid">
          <ImpactCard
            icon="TR"
            label="Trees planted equivalent"
            value={treesEquivalent}
            detail="Using 21 kg CO2 absorbed per tree per year"
          />
          <ImpactCard
            icon="KM"
            label="Driving avoided"
            value={`${formatNumber(drivingAvoidedKm)} km`}
            detail="Using 0.21 kg CO2 per car kilometer"
          />
          <ImpactCard
            icon="HR"
            label="Electricity saved"
            value={`${formatNumber(electricityHoursSaved)} hours`}
            detail="Using 0.4 kg CO2 per kWh equivalent"
          />
          <ImpactCard
            icon="RE"
            label="Products reused"
            value={totalProducts}
            detail="Total listings kept in circulation"
          />
        </div>
      </section>

      <section className="dashboard-findings-card">
        <p className="dashboard-eyebrow">Generated summary</p>
        <h2>Key Findings</h2>
        <ol className="dashboard-findings-list">
          <li>
            Most popular category:{" "}
            <strong>{mostPopularCategory?.name || "No category data yet"}</strong>
          </li>
          <li>
            Highest value category:{" "}
            <strong>{highestAveragePriceCategory?.name || "No price data yet"}</strong>
          </li>
          <li>
            Largest waste reduction contributor:{" "}
            <strong>{largestWasteCategory?.name || "No weight data yet"}</strong>
          </li>
          <li>
            Largest CO2 reduction contributor:{" "}
            <strong>{largestCo2Material?.name || "No material data yet"}</strong>
          </li>
          <li>
            Overall observation:{" "}
            <strong>
              {hasProducts
                ? `The marketplace has reused ${totalProducts} products with ${formatNumber(wasteReduced)} kg of waste diverted and ${formatNumber(co2Saved)} kg of estimated CO2 savings.`
                : "The marketplace needs product listings before sustainability findings can be generated."}
            </strong>
          </li>
        </ol>
      </section>
    </div>
  );
}

export default Dashboard;
