import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  const { to, subject, text } = req.body;

  // 2. 檢查環境變數是否已在 Vercel 後台設定
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('環境變數遺失：GMAIL_USER 或 GMAIL_PASS 未設定');
    return res.status(500).json({ error: '伺服器端未設定寄信帳號密碼' });
  }

  // 3. 設定 Nodemailer 傳輸器
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // 這裡填入那 16 字元的應用程式密碼
    },
  });

  try {
    // 4. 發送郵件
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: to || process.env.GMAIL_USER, // 如果前端沒傳收件人，預設寄給自己
      subject: subject || '系統通知',
      text: text || '無內容',
    });

    console.log('郵件發送成功');
    return res.status(200).json({ success: true, message: '信件已送出' });
    
  } catch (error) {
    // 5. 錯誤處理 (如果這裡報錯，通常是帳密不對或連線問題)
    console.error('Nodemailer 發送失敗詳細原因:', error);
    return res.status(500).json({ error: '寄信失敗，請檢查 Gmail 設定', details: error.message });
  }
}
