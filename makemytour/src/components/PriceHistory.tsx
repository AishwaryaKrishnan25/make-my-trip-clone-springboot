// src/src/components/PriceHistory.tsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns"; // optional if you want date parsing (install if used)
import { getPriceHistory, freezePrice, getCurrentPrice } from "@/api";

type PriceHistoryItem = {
  id?: string;
  productType?: string;
  productId?: string;
  price: number;
  timestamp: string;
  reason?: string;
};

type Props = {
  flightId: string;
};

function registerChartJsIfNeeded() {
  // Only register on client to avoid SSR issues
  if (typeof window !== "undefined" && !(ChartJS as any)._registeredForMyApp) {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler,
      TimeScale
    );
    // mark as registered to avoid double registration
    (ChartJS as any)._registeredForMyApp = true;
  }
}

export default function PriceHistory({ flightId }: Props) {
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [freezeMinutes, setFreezeMinutes] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ensure ChartJS registered on client
  useEffect(() => {
    registerChartJsIfNeeded();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const h = await getPriceHistory(flightId);
      setHistory(h || []);
      const cur = await getCurrentPrice(flightId);
      setCurrent(cur);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load price history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!flightId) return;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightId]);

  async function onFreeze() {
    setFreezeLoading(true);
    try {
      await freezePrice(flightId, freezeMinutes);
      await load();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to freeze price");
    } finally {
      setFreezeLoading(false);
    }
  }

  // Prepare chart data: use timestamps as labels
  const chartData = {
    labels: history.map((h) => new Date(h.timestamp).toISOString()),
    datasets: [
      {
        label: "Price",
        data: history.map((h) => ({ x: new Date(h.timestamp).toISOString(), y: h.price })),
        fill: true,
        tension: 0.2,
        pointRadius: 3,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    scales: {
      x: {
        type: "time",
        time: {
          tooltipFormat: "PP p",
          unit: "hour",
        },
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price",
        },
        beginAtZero: false,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const v = context.parsed?.y ?? context.parsed;
            return `₹ ${v}`;
          },
        },
      },
    },
  };

  return (
    <div className="p-4 border rounded shadow-sm max-w-3xl">
      <h3 className="text-lg font-semibold mb-2">Pricing</h3>

      {loading ? (
        <div>Loading price info...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <>
          <div className="mb-3">
            <div>
              Current price:{" "}
              <strong>
                {current?.currentPrice !== undefined ? `₹ ${current.currentPrice}` : "—"}
              </strong>
            </div>
            <div>Base price: {current?.basePrice ? `₹ ${current.basePrice}` : "—"}</div>
            <div>
              Price freeze until:{" "}
              {current?.priceFreezeUntil ? new Date(current.priceFreezeUntil).toLocaleString() : "Not frozen"}
            </div>
          </div>

          <div style={{ height: 280 }} className="mb-3">
            {history && history.length > 0 ? (
              <Line data={chartData as any} options={chartOptions} />
            ) : (
              <div className="text-sm text-gray-600">No price history yet.</div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm">Freeze price for</label>
            <input
              type="number"
              min={1}
              className="border px-2 py-1 rounded w-20"
              value={freezeMinutes}
              onChange={(e) => setFreezeMinutes(parseInt(e.target.value || "0", 10))}
            />
            <span className="text-sm">minutes</span>
            <button
              onClick={onFreeze}
              disabled={freezeLoading}
              className="ml-3 px-3 py-1 bg-blue-600 text-white rounded"
            >
              {freezeLoading ? "Freezing..." : "Freeze Price"}
            </button>
            <button onClick={load} className="ml-2 px-3 py-1 border rounded">
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}
