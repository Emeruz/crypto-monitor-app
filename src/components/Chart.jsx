import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const Chart = ({ coinId = 'bitcoin' }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInterval = useRef(null);

  // Format price data
  const formatData = (prices) => {
    return prices.map(([timestamp, price]) => ({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(price.toFixed(4))
    }));
  };

  // Fetch initial chart data
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`
      );
      const data = await response.json();
      setChartData(formatData(data.prices));
    } catch (err) {
      console.error('Initial chart data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch latest price point
  const fetchLatestPrice = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      const data = await response.json();
      const newPrice = data[coinId]?.usd;
      
      if (newPrice && chartData.length > 0) {
        const lastPoint = chartData[chartData.length - 1];
        const now = new Date();
        
        // Only update if price changed significantly or it's been >1 minute
        if (Math.abs(newPrice - lastPoint.price) > 0.01 || 
            now - new Date(lastPoint.timestamp) > 60000) {
          const newDataPoint = {
            timestamp: now.getTime(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: newPrice
          };
          setChartData(prev => [...prev.slice(-200), newDataPoint]); // Keep last 200 points
        }
      }
    } catch (err) {
      console.error('Latest price fetch error:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    
    // Set up polling for latest price (every 30 seconds)
    fetchInterval.current = setInterval(fetchLatestPrice, 30000);
    
    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    };
  }, [coinId]);

  const option = {
    animation: true,
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0].data;
        return `
          <strong>${coinId.toUpperCase()}</strong><br/>
          Price: $${data.price.toFixed(4)}<br/>
          Time: ${data.time}
        `;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.time),
      axisLabel: {
        interval: Math.floor(chartData.length / 6) // Show ~6 labels
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [{
      name: coinId.toUpperCase(),
      type: 'line',
      data: chartData.map(d => ({
        value: d.price,
        time: d.time,
        price: d.price
      })),
      showSymbol: false,
      lineStyle: {
        color: '#4f46e5',
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(79, 70, 229, 0.3)'
          }, {
            offset: 1, color: 'rgba(79, 70, 229, 0.01)'
          }]
        }
      }
    }]
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          Loading chart...
        </div>
      ) : (
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }} 
          notMerge={true} // Important for smooth updates
        />
      )}
    </div>
  );
};

export default Chart;