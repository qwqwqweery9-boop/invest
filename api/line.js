// api/line.js
export default async function handler(req, res) {
    // 只接受 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, message } = req.body;

    if (!token || !message) {
        return res.status(400).json({ error: '缺少 Token 或訊息內容' });
    }

    try {
        // 透過原生 fetch 打給 LINE Notify 官方 API
        const response = await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}` // 帶入使用者自己填的 Token
            },
            // LINE 規定要用這種格式傳送資料
            body: new URLSearchParams({ message: message }) 
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, data });
        } else {
            return res.status(response.status).json({ error: data });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
