import React, { useEffect, useState } from 'react';
import Chart from './Chart';
import styles from './CryptoDashboard.module.css';

const CryptoDashboard = () => {
  const [selectedCoin, setSelectedCoin] = useState('cardano');
  const [priceData, setPriceData] = useState(null);
  const [allCoinsData, setAllCoinsData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  const [alertEnabled, setAlertEnabled] = useState(false);
  const [tempUpper, setTempUpper] = useState(70000);
  const [tempLower, setTempLower] = useState(60000);
  const [tempMethod, setTempMethod] = useState('browser');

  const [savedUpper, setSavedUpper] = useState(null);
  const [savedLower, setSavedLower] = useState(null);
  const [alertActive, setAlertActive] = useState(false);

  const coins = [
    { id: 'bitcoin', label: 'BTC', icon: '🟠' },
    { id: 'ethereum', label: 'ETH', icon: '🔷' },
    { id: 'solana', label: 'SOL', icon: '🟣' },
    { id: 'cardano', label: 'ADA', icon: '🔵' },
  ];

  // Fetch data for all coins
  const fetchAllCoinsData = async () => {
    try {
      const coinIds = coins.map(c => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      setAllCoinsData(data);
    } catch (error) {
      console.error('Error fetching all coins data:', error);
    }
  };

  // Fetch data for selected coin
  const fetchSelectedCoinData = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      const coinData = data[selectedCoin];
      
      setPriceData(coinData);
      setLastUpdated(new Date());

      if (alertActive && savedUpper != null && savedLower != null) {
        const currentPrice = coinData.usd;
        if (currentPrice >= savedUpper) {
          alert(`🚨 ${selectedCoin.toUpperCase()} price exceeded ${savedUpper} USD! Current: ${currentPrice} USD`);
          setAlertActive(false);
        } else if (currentPrice <= savedLower) {
          alert(`🚨 ${selectedCoin.toUpperCase()} price dropped below ${savedLower} USD! Current: ${currentPrice} USD`);
          setAlertActive(false);
        }
      }
    } catch (error) {
      console.error('Error fetching selected coin data:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAllCoinsData();
    fetchSelectedCoinData();

    // Set up intervals for updates
    const allCoinsInterval = setInterval(fetchAllCoinsData, 30000); // 30 seconds
    const selectedCoinInterval = setInterval(fetchSelectedCoinData, 10000); // 10 seconds

    return () => {
      clearInterval(allCoinsInterval);
      clearInterval(selectedCoinInterval);
    };
  }, [selectedCoin, alertActive, savedUpper, savedLower]);

  const handleSave = () => {
    setSavedUpper(tempUpper);
    setSavedLower(tempLower);
    setAlertActive(true);
    alert('✅ Alert settings saved!');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>📈 CryptoAlert</div>
        <div className={styles.actions}>
          <i className="fas fa-bell"></i>
          <i className="fas fa-user"></i>
        </div>
      </header>

      <main className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Crypto Monitoring</h2>
              <div className={styles.coinInfo}>
                <div className={styles.coinIcon}>
                  {coins.find(c => c.id === selectedCoin)?.icon}
                </div>
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
              {coins.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label} (${allCoinsData[c.id]?.usd?.toFixed(2) || '...'})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.priceDisplay}>
            <h1>${priceData?.usd?.toFixed(2) || '...'}</h1>
            <div
              className={styles.percentChange}
              style={{ color: priceData?.usd_24h_change > 0 ? 'green' : 'red' }}
            >
              {priceData?.usd_24h_change > 0 ? '▲' : '▼'} {priceData?.usd_24h_change?.toFixed(2)}% (24h)
            </div>
            <div className={styles.timestamp}>
              Last updated: {lastUpdated?.toLocaleTimeString()}
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
                  <div className={styles.sub}>
                    {allCoinsData[c.id] ? `$${allCoinsData[c.id].usd.toFixed(2)}` : '...'}
                    <span style={{
                      color: allCoinsData[c.id]?.usd_24h_change > 0 ? 'green' : 'red',
                      fontSize: '0.8rem',
                      marginLeft: '4px'
                    }}>
                      {allCoinsData[c.id]?.usd_24h_change > 0 ? '↑' : '↓'} {Math.abs(allCoinsData[c.id]?.usd_24h_change?.toFixed(2) || 0)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h2>Alert Settings</h2>
            <div className={styles.row}>
              <span>Price Alert</span>
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => setAlertEnabled(e.target.checked)}
              />
            </div>

            <fieldset
              disabled={!alertEnabled}
              className={!alertEnabled ? styles.disabledForm : ''}
            >
              <div className={styles.row}>
                <label>Upper Limit (USD)</label>
                <input
                  type="number"
                  value={tempUpper}
                  onChange={(e) => setTempUpper(Number(e.target.value))}
                />
              </div>
              <hr />
              <div className={styles.row}>
                <label>Lower Limit (USD)</label>
                <input
                  type="number"
                  value={tempLower}
                  onChange={(e) => setTempLower(Number(e.target.value))}
                />
              </div>
              <hr />
              <label>Notification Method</label>
              <div onChange={(e) => setTempMethod(e.target.value)}>
                <input
                  type="radio"
                  value="browser"
                  name="method"
                  checked={tempMethod === 'browser'}
                /> Browser Notification<br />

                <input
                  type="radio"
                  value="email"
                  name="method"
                  checked={tempMethod === 'email'}
                /> Email Alert<br />

                <input
                  type="radio"
                  value="telegram"
                  name="method"
                  checked={tempMethod === 'telegram'}
                /> Telegram Alert
              </div>

              <button className={styles.save} onClick={handleSave}>
                Save Alert Settings
              </button>
            </fieldset>
          </div>

          <div className={styles.card}>
            <h2>Active Alerts</h2>
            <div className={styles.emptyAlert}>
              {alertActive ? (
                <p>✅ Alert active for {selectedCoin.toUpperCase()} between ${savedLower} - ${savedUpper}</p>
              ) : (
                <>
                  <div className={styles.bellIcon}>🔕</div>
                  <p>No active alerts</p>
                  <small>Enable alerts to get notified about price changes</small>
                </>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default CryptoDashboard;