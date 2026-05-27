import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  const { to, subject, text } = req.body;

  // 1. 檢查變數
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: '伺服器未設定 GMAIL_USER 或 GMAIL_PASS 環境變數' });
  }

  if (!to) {
    return res.status(400).json({ error: '未提供接收信箱 (to)' });
  }

  // 2. 建立發送器（開啟 debug 模式）
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    debug: true,   // 顯示詳細 SMTP 連線日誌
    logger: true   // 將日誌印到伺服器主控台
  });

  // 3. 嚴格驗證連線狀況
  try {
    console.log('正在嘗試連接 Gmail SMTP 伺服器...');
    await transporter.verify();
    console.log('Gmail SMTP 連線驗證成功！準備寄信...');
  } catch (verifyError) {
    console.error('Gmail 連線驗證失敗（通常是帳密或安全鎖問題）:', verifyError);
    return res.status(500).json({ 
      error: 'Gmail 驗證失敗', 
      code: verifyError.code, 
      command: verifyError.command,
      message: verifyError.message 
    });
  }

  // 4. 執行寄信
  try {
    const info = await transporter.sendMail({
      from: `"資產監控系統" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject || '系統通知',
      text: text || '無內容',
    });

    console.log('郵件發送成功，MessageID:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (sendError) {
    console.error('Nodemailer 寄信本體失敗:', sendError);
    return res.status(500).json({ 
      error: '寄信失敗', 
      code: sendError.code,
      message: sendError.message 
    });
  }
}
