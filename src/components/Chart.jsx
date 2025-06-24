import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const Chart = ({ coinId = 'bitcoin' }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!coinId) return;

    fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
    )
      .then((res) => res.json())
      .then((data) => {
        const prices = data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toLocaleDateString(),
          price,
        }));
        setChartData(prices);
      })
      .catch((err) => console.error('Chart fetch error:', err));
  }, [coinId]);

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.date),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      scale: true,
    },
    series: [
      {
        name: coinId.toUpperCase(),
        type: 'line',
        data: chartData.map((d) => d.price),
        smooth: true,
        lineStyle: {
          color: 'green',
          width: 1.5,
        },
        areaStyle: {
          color: 'rgba(89, 50, 234, 0.1)',
        },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <ReactECharts option={option} style={{ height: '250px', width: '100%' }} />
    </div>
  );
};

export default Chart;
