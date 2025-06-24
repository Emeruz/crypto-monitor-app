// ✅ CryptoDashboard.jsx
import React, { useEffect, useState } from 'react';
import Chart from './Chart';
import styles from './CryptoDashboard.module.css';

const CryptoDashboard = () => {
  const [selectedCoin, setSelectedCoin] = useState('cardano');
  const [priceData, setPriceData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const coins = [
    { id: 'bitcoin', label: 'BTC', icon: '🟣' },
    { id: 'ethereum', label: 'ETH', icon: '🟣' },
    { id: 'solana', label: 'SOL', icon: '🟣' },
    { id: 'cardano', label: 'ADA', icon: '🟣' },
  ];

  useEffect(() => {
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=usd&include_24hr_change=true`)
      .then(res => res.json())
      .then(data => {
        setPriceData(data[selectedCoin]);
        setLastUpdated(new Date());
      });
  }, [selectedCoin]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>📈 CryptoAlert</div>
        <div className={styles.actions}>
          <i className="fas fa-bell"></i>
          <i className="fas fa-user"></i>
        </div>
      </header>

      <main className={styles.grid}>
        {/* Left Main Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Crypto Monitoring</h2>
              <div className={styles.coinInfo}>
                <div className={styles.coinIcon} />
                <div>
                  <strong>{selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)}</strong>
                  <div className={styles.symbol}>{selectedCoin.toUpperCase()}/USD</div>
                </div>
              </div>
            </div>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className={styles.dropdown}
            >
              {coins.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div className={styles.priceDisplay}>
            <h1>${priceData?.usd?.toFixed(2) || '...'}</h1>
            <div className={styles.percentChange} style={{ color: priceData?.usd_24h_change > 0 ? 'green' : 'red' }}>
              {priceData?.usd_24h_change > 0 ? '▲' : '▼'} {priceData?.usd_24h_change?.toFixed(2)}% (24h)
            </div>
            <div className={styles.timestamp}>
              Last updated: {lastUpdated?.toLocaleDateString()} • {lastUpdated?.toLocaleTimeString()}
            </div>
          </div>

          <div className={styles.chartWrapper}>
            <Chart coinId={selectedCoin} />
          </div>

          <div className={styles.coinToggleGroup}>
            {coins.map(c => (
              <button
                key={c.id}
                className={`${styles.coinToggle} ${selectedCoin === c.id ? styles.activeCoin : ''}`}
                onClick={() => setSelectedCoin(c.id)}
              >
                <div className={styles.toggleIcon}>{c.icon}</div>
                <div>
                  <strong>{c.label}</strong>
                  <div className={styles.sub}>${c.id === selectedCoin ? priceData?.usd?.toFixed(2) : '—'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h2>Alert Settings</h2>
            <div className={styles.row}><span>Price Alert</span> <input type="checkbox" /></div>

            <fieldset disabled className={styles.disabledForm}>
              <label>Upper Limit (USD)</label>
              <input type="text" value="$70000" readOnly />

              <label>Lower Limit (USD)</label>
              <input type="text" value="$60000" readOnly />

              <label>Notification Method</label>
              <div>
                <input type="radio" defaultChecked name="method" /> Browser Notification<br />
                <input type="radio" name="method" /> Email Alert<br />
                <input type="radio" name="method" /> Telegram Alert
              </div>

              <button className={styles.save}>Save Alert Settings</button>
            </fieldset>
          </div>

          <div className={styles.card}>
            <h2>Active Alerts</h2>
            <div className={styles.emptyAlert}>
              <div className={styles.bellIcon}>🔕</div>
              <p>No active alerts</p>
              <small>Enable alerts to get notified about price changes</small>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default CryptoDashboard;
