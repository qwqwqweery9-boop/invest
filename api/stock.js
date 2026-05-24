// api/stock.js
export default async function handler(req, res) {
    const { symbol } = req.query;
    if (!symbol) {
        return res.status(400).json({ error: "Missing symbol parameter" });
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).json({ error: `Yahoo API responded with status ${response.status}` });
        }

        const json = await response.json();
        
        // 確保 Yahoo 有回傳正確的 chart.result 結構
        if (!json.chart || !json.chart.result || json.chart.result.length === 0) {
            return res.status(500).json({ error: "Invalid data structure from Yahoo" });
        }

        const result = json.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        // 將資料扁平化為陣列
        const formattedData = timestamps.map((t, i) => ({
            date: new Date(t * 1000).toISOString().split('T')[0],
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0,
            value: quotes.close[i] // 為了兼容外匯線圖而保留的屬性
        })).filter(item => item.open !== null); // 去除沒有開盤資料的日期（例如假日）

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
