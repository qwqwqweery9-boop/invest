import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  // 接收前端傳來的：收件人、主旨、內容
  const { to, subject, text } = req.body;

  // 檢查伺服器環境變數
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('環境變數遺失：未設定 GMAIL_USER 或 GMAIL_PASS');
    return res.status(500).json({ error: '伺服器未設定寄信帳密' });
  }

  // 檢查是否填寫收件人
  if (!to) {
    return res.status(400).json({ error: '未提供接收信箱' });
  }

  // 設定 Gmail 發送器
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // 16字元應用程式密碼
    },
  });

  try {
    // 執行寄信
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject || '系統通知',
      text: text || '無內容',
    });

    return res.status(200).json({ success: true, message: '信件已成功送出' });
  } catch (error) {
    console.error('Nodemailer 發信失敗:', error);
    return res.status(500).json({ error: '寄信失敗，請檢查設定', details: error.message });
  }
}
