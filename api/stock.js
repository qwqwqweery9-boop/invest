// api/stock.js
export default async function handler(req, res) {
    const { symbol, interval = '1d' } = req.query;
    if (!symbol) {
        return res.status(400).json({ error: "Missing symbol parameter" });
    }

    // 根據不同的 K棒級別，決定抓取的時間範圍 (Yahoo API 的限制)
    let range = '1y';
    if (interval === '15m' || interval === '30m') range = '60d'; // 分鐘線最多只能抓近 60 天
    else if (interval === '60m' || interval === '1h') range = '730d'; // 小時線最多 2 年
    else if (interval === '1wk') range = '5y'; // 周線抓 5 年

    // 注意：Yahoo 的 1小時參數是 60m
    const queryInterval = interval === '1h' ? '60m' : interval;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${queryInterval}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return res.status(response.status).json({ error: `Yahoo API error ${response.status}` });
        
        const json = await response.json();
        if (!json.chart || !json.chart.result || json.chart.result.length === 0) {
            return res.status(500).json({ error: "Invalid data structure" });
        }

        const result = json.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        const formattedData = timestamps.map((t, i) => {
            const dateObj = new Date(t * 1000);
            // 如果是分鐘或小時線，顯示包含時間的格式；如果是日/周線，只顯示日期
            const isIntraday = interval.includes('m') || interval === '1h';
            const dateStr = isIntraday 
                ? dateObj.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                : dateObj.toISOString().split('T')[0];

            return {
                date: dateStr,
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                volume: quotes.volume[i] || 0,
                value: quotes.close[i]
            };
        }).filter(item => item.open !== null);

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
