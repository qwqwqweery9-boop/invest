// api/send-mail.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, email, subject, message, assetId, targetPrice, currentPrice } = req.body;

    // 建立 Gmail SMTP 傳送器
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER, // 你的 Gmail 信箱
            pass: process.env.GMAIL_PASS  // 你的 Gmail 應用程式密碼
        }
    });

    let mailOptions = {};

    // 根據不同情境設定信件內容
    if (type === 'contact') {
        mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // 訪客問題直接寄給自己
            replyTo: email,
            subject: `📩 [資產監控面板問題回饋] ${subject}`,
            text: `訪客聯絡信箱: ${email}\n\n回饋內容:\n${message}`
        };
    } else if (type === 'alert') {
        mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // 警報信也是寄給自己
            subject: `🚨 [價格警報觸及] 標的 ${assetId} 已達到您的目標價！`,
            text: `您在資產監控面板設定的價格警報已觸發！\n\n標的代號: ${assetId}\n設定目標價: ${targetPrice}\n當前最新價: ${currentPrice}\n\n請即時回面板確認行情。`
        };
    }

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
