import React, { useEffect, useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import Chart from './Chart';
import styles from './CryptoDashboard.module.css';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

const AnimatedCheckbox = ({ checked, onChange }) => {  
  const checkboxWrapperRef = useRef(null);  
  const tweenRef = useRef(null);  

  useGSAP(() => {  
    if (checkboxWrapperRef.current) {  
      tweenRef.current = gsap.to(checkboxWrapperRef.current, {  
        rotation: 360,  
        duration: 2,  
        repeat: -1,  
        ease: 'linear',  
        paused: true,  
        transformOrigin: "center"  
      });  
    }  
  }, []);  

  const handleCheckboxChange = (e) => {  
    const isChecked = e.target.checked;  
    onChange(isChecked);
    if (isChecked) {  
      tweenRef.current?.play();  
    } else {  
      tweenRef.current?.pause().progress(0);  
    }  
  };

  return (
    <div>  
      <span  
        ref={checkboxWrapperRef}  
        style={{ display: 'inline-block', transformOrigin: 'center' }}  
      >  
        <input  
          type="checkbox"  
          checked={checked}
          onChange={handleCheckboxChange}  
        />  
      </span>  
    </div>
  );
};

const CryptoDashboard = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [priceData, setPriceData] = useState(null);
  const [allCoinsData, setAllCoinsData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

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

  const fetchAllCoinsData = async () => {
    try {
      const coinIds = coins.map(c => c.id).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await res.json();
      setAllCoinsData(data);
    } catch (err) {
      console.error('All coins fetch error:', err);
    }
  };

  const fetchSelectedCoinData = async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${selectedCoin}?localization=false&tickers=false&market_data=true`
      );

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      setPriceData({
        usd: data.market_data.current_price.usd,
        usd_24h_change: data.market_data.price_change_percentage_24h,
        high_24h: data.market_data.high_24h.usd,
        low_24h: data.market_data.low_24h.usd,
      });
      setLastUpdated(new Date());

      // Alert check
      if (alertActive && savedUpper && savedLower) {
        const curPrice = data.market_data.current_price.usd;
        if (curPrice >= savedUpper) triggerAlert('upper', curPrice);
        if (curPrice <= savedLower) triggerAlert('lower', curPrice);
      }
    } catch (err) {
      console.error('Selected coin fetch error:', err);
      setFetchError(true);
      setPriceData({
        usd: 50000,
        usd_24h_change: 0.5,
        high_24h: 50500,
        low_24h: 49500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAlert = (type, currentPrice) => {
    const msg =
      type === 'upper'
        ? `🚨 ${selectedCoin.toUpperCase()} crossed above $${savedUpper} (Now: $${currentPrice.toFixed(2)})`
        : `🚨 ${selectedCoin.toUpperCase()} dropped below $${savedLower} (Now: $${currentPrice.toFixed(2)})`;
    alert(msg);
    setAlertActive(false);
  };

  useEffect(() => {
    fetchAllCoinsData();
    fetchSelectedCoinData();

    const allInterval = setInterval(fetchAllCoinsData, 30000);
    const selectedInterval = setInterval(fetchSelectedCoinData, 15000);

    return () => {
      clearInterval(allInterval);
      clearInterval(selectedInterval);
    };
  }, [selectedCoin, alertActive]);

  const handleSaveAlert = () => {
    if (!tempUpper || !tempLower) {
      alert('Set both upper and lower limits');
      return;
    }
    if (parseFloat(tempUpper) <= parseFloat(tempLower)) {
      alert('Upper limit must be higher than lower limit');
      return;
    }
    setSavedUpper(parseFloat(tempUpper));
    setSavedLower(parseFloat(tempLower));
    setAlertActive(true);
    alert('✅ Alert saved!');
  };

  return (
    <div className={styles.page}>
      {/* Header */}
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
        {/* Main Card */}
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
            {isLoading ? (
              <p>Loading price...</p>
            ) : fetchError ? (
              <p style={{ color: 'red' }}>⚠️ Error loading data. Showing fallback.</p>
            ) : (
              <>
                <h1>${priceData.usd.toLocaleString()}</h1>
                <p className={priceData.usd_24h_change >= 0 ? styles.positive : styles.negative}>
                  {priceData.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(priceData.usd_24h_change).toFixed(2)}% (24h)
                </p>
                <p>24h High: ${priceData.high_24h.toLocaleString()}</p>
                <p>24h Low: ${priceData.low_24h.toLocaleString()}</p>
              </>
            )}
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
                <span
                  className={`${styles.tabChange} ${
                    allCoinsData[c.id]?.usd_24h_change >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {allCoinsData[c.id]?.usd_24h_change >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(allCoinsData[c.id]?.usd_24h_change || 0).toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Alerts */}
        <aside className={styles.sidebar}>
          <div className={styles.alertCard}>
            <h3>Price Alerts</h3>
            <div className={styles.alertToggle}>
              <label>Enable Alerts</label>
              <AnimatedCheckbox 
                checked={alertEnabled}
                onChange={setAlertEnabled}
              />
            </div>

            <fieldset disabled={!alertEnabled} className={styles.alertForm}>
              <label>Upper Limit (USD)</label>
              <input
                type="number"
                value={tempUpper}
                onChange={(e) => setTempUpper(e.target.value)}
                placeholder="e.g. 70000"
              />

              <label>Lower Limit (USD)</label>
              <input
                type="number"
                value={tempLower}
                onChange={(e) => setTempLower(e.target.value)}
                placeholder="e.g. 60000"
              />

              <label>Notification Method</label>
              <div>
                <input
                  type="radio"
                  value="browser"
                  checked={tempMethod === 'browser'}
                  onChange={() => setTempMethod('browser')}
                /> Browser<br />
                <input
                  type="radio"
                  value="email"
                  checked={tempMethod === 'email'}
                  onChange={() => setTempMethod('email')}
                /> Email<br />
                <input
                  type="radio"
                  value="telegram"
                  checked={tempMethod === 'telegram'}
                  onChange={() => setTempMethod('telegram')}
                /> Telegram
              </div>

              <button
                onClick={handleSaveAlert}
                className={styles.saveButton}
              >
                Save Alert Settings
              </button>
            </fieldset>
          </div>

          <div className={styles.activeAlertsCard}>
            <h3>Active Alerts</h3>
            {alertActive ? (
              <div className={styles.activeAlert}>
                <strong>{selectedCoin.toUpperCase()}</strong>
                <p>Alert between ${savedLower} - ${savedUpper}</p>
                <small>Notify via {tempMethod}</small>
              </div>
            ) : (
              <div className={styles.noAlerts}>
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