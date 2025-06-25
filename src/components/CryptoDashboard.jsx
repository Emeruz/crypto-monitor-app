import React, { useEffect, useState } from 'react';
import Chart from './Chart';
import styles from './CryptoDashboard.module.css';

const CryptoDashboard = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [priceData, setPriceData] = useState(null);
  const [allCoinsData, setAllCoinsData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Alert states
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [tempUpper, setTempUpper] = useState('');
  const [tempLower, setTempLower] = useState('');
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

  // Fetch all coins data
  const fetchAllCoinsData = async () => {
    try {
      const coinIds = coins.map(c => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      setAllCoinsData(data);
    } catch (error) {
      console.error('Error fetching all coins:', error);
    }
  };

  // Fetch detailed data for selected coin
  const fetchSelectedCoinData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${selectedCoin}?localization=false&tickers=false&market_data=true`
      );
      const data = await response.json();
      
      setPriceData({
        usd: data.market_data.current_price.usd,
        usd_24h_change: data.market_data.price_change_percentage_24h,
        high_24h: data.market_data.high_24h.usd,
        low_24h: data.market_data.low_24h.usd
      });
      setLastUpdated(new Date());
      
      // Check alerts
      if (alertActive && savedUpper && savedLower) {
        const currentPrice = data.market_data.current_price.usd;
        if (currentPrice >= savedUpper) {
          triggerAlert('upper', currentPrice);
        } else if (currentPrice <= savedLower) {
          triggerAlert('lower', currentPrice);
        }
      }
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAlert = (type, currentPrice) => {
    const message = type === 'upper' 
      ? `🚨 ${selectedCoin.toUpperCase()} exceeded $${savedUpper}! (Current: $${currentPrice.toFixed(2)})`
      : `🚨 ${selectedCoin.toUpperCase()} dropped below $${savedLower}! (Current: $${currentPrice.toFixed(2)})`;
    
    alert(message);
    setAlertActive(false);
  };

  // Initialize and set up intervals
  useEffect(() => {
    fetchAllCoinsData();
    fetchSelectedCoinData();

    const allCoinsInterval = setInterval(fetchAllCoinsData, 30000);
    const selectedCoinInterval = setInterval(fetchSelectedCoinData, 15000);

    return () => {
      clearInterval(allCoinsInterval);
      clearInterval(selectedCoinInterval);
    };
  }, [selectedCoin, alertActive]);

  const handleSaveAlert = () => {
    if (!tempUpper || !tempLower) {
      alert('Please set both upper and lower limits');
      return;
    }
    if (parseFloat(tempUpper) <= parseFloat(tempLower)) {
      alert('Upper limit must be greater than lower limit');
      return;
    }

    setSavedUpper(parseFloat(tempUpper));
    setSavedLower(parseFloat(tempLower));
    setAlertActive(true);
    alert('Alert saved successfully!');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📈</span>
          <span>CryptoAlert Pro</span>
        </div>
        <div className={styles.lastUpdated}>
          {lastUpdated && `Last update: ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </header>

      <main className={styles.grid}>
        {/* Main Chart Section */}
        <div className={styles.mainCard}>
          <div className={styles.coinHeader}>
            <div className={styles.coinTitle}>
              <span className={styles.coinIcon}>
                {coins.find(c => c.id === selectedCoin)?.icon}
              </span>
              <h2>
                {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)}
                <span className={styles.coinPair}>/{selectedCoin.toUpperCase()}</span>
              </h2>
            </div>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className={styles.coinDropdown}
            >
              {coins.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label} (${allCoinsData[c.id]?.usd?.toFixed(2) || '...'})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.priceDisplay}>
            <div className={styles.currentPrice}>
              {isLoading ? (
                <div className={styles.loadingPrice}>Loading...</div>
              ) : (
                <>
                  <span className={styles.price}>${priceData?.usd?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span 
                    className={`${styles.priceChange} ${priceData?.usd_24h_change >= 0 ? styles.positive : styles.negative}`}
                  >
                    {priceData?.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(priceData?.usd_24h_change?.toFixed(2))}% (24h)
                  </span>
                </>
              )}
            </div>
            <div className={styles.priceRange}>
              {priceData && (
                <>
                  <span>24h High: ${priceData.high_24h.toLocaleString()}</span>
                  <span>24h Low: ${priceData.low_24h.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.chartContainer}>
            <Chart coinId={selectedCoin} />
          </div>

          <div className={styles.coinTabs}>
            {coins.map(c => (
              <button
                key={c.id}
                className={`${styles.coinTab} ${selectedCoin === c.id ? styles.activeTab : ''}`}
                onClick={() => setSelectedCoin(c.id)}
              >
                <span className={styles.tabIcon}>{c.icon}</span>
                <span className={styles.tabLabel}>{c.label}</span>
                <span className={styles.tabPrice}>
                  ${allCoinsData[c.id]?.usd?.toFixed(2) || '...'}
                </span>
                <span className={`${styles.tabChange} ${allCoinsData[c.id]?.usd_24h_change >= 0 ? styles.positive : styles.negative}`}>
                  {allCoinsData[c.id]?.usd_24h_change >= 0 ? '↑' : '↓'} {Math.abs(allCoinsData[c.id]?.usd_24h_change?.toFixed(2) || 0)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Alert Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.alertCard}>
            <h3 className={styles.cardTitle}>Price Alerts</h3>
            
            <div className={styles.alertToggle}>
              <label>Enable Alerts</label>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={alertEnabled}
                  onChange={(e) => setAlertEnabled(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={`${styles.alertForm} ${!alertEnabled ? styles.disabled : ''}`}>
              <div className={styles.alertInputGroup}>
                <label>Upper Limit (USD)</label>
                <input
                  type="number"
                  value={tempUpper}
                  onChange={(e) => setTempUpper(e.target.value)}
                  placeholder="e.g. 70000"
                  disabled={!alertEnabled}
                />
              </div>

              <div className={styles.alertInputGroup}>
                <label>Lower Limit (USD)</label>
                <input
                  type="number"
                  value={tempLower}
                  onChange={(e) => setTempLower(e.target.value)}
                  placeholder="e.g. 60000"
                  disabled={!alertEnabled}
                />
              </div>

              <div className={styles.notificationMethod}>
                <label>Notification Method</label>
                <div className={styles.methodOptions}>
                  <label className={styles.methodOption}>
                    <input
                      type="radio"
                      value="browser"
                      checked={tempMethod === 'browser'}
                      onChange={() => setTempMethod('browser')}
                      disabled={!alertEnabled}
                    />
                    <span>Browser</span>
                  </label>
                  <label className={styles.methodOption}>
                    <input
                      type="radio"
                      value="email"
                      checked={tempMethod === 'email'}
                      onChange={() => setTempMethod('email')}
                      disabled={!alertEnabled}
                    />
                    <span>Email</span>
                  </label>
                  <label className={styles.methodOption}>
                    <input
                      type="radio"
                      value="telegram"
                      checked={tempMethod === 'telegram'}
                      onChange={() => setTempMethod('telegram')}
                      disabled={!alertEnabled}
                    />
                    <span>Telegram</span>
                  </label>
                </div>
              </div>

              <button 
                className={styles.saveButton}
                onClick={handleSaveAlert}
                disabled={!alertEnabled}
              >
                Save Alert Settings
              </button>
            </div>
          </div>

          <div className={styles.activeAlertsCard}>
            <h3 className={styles.cardTitle}>Active Alerts</h3>
            {alertActive ? (
              <div className={styles.activeAlert}>
                <div className={styles.alertIcon}>🔔</div>
                <div className={styles.alertDetails}>
                  <strong>{selectedCoin.toUpperCase()}</strong>
                  <p>Alert set between ${savedLower} - ${savedUpper}</p>
                  <small>Notification: {tempMethod}</small>
                </div>
              </div>
            ) : (
              <div className={styles.noAlerts}>
                <div className={styles.noAlertsIcon}>🔕</div>
                <p>No active alerts</p>
                <small>Set price alerts to get notified</small>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default CryptoDashboard;