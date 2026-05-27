import { Resend } from 'resend';

// 初始化 Resend，直接抓取環境變數
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  const { to, subject, text } = req.body;

  // 1. 檢查內部密鑰
  if (!process.env.RESEND_API_KEY) {
    console.error('環境變數遺失：未設定 RESEND_API_KEY');
    return res.status(500).json({ error: '伺服器未設定發信金鑰' });
  }

  if (!to) {
    return res.status(400).json({ error: '未提供接收信箱' });
  }

  try {
    console.log(`正在透過 Resend 發送警報信至: ${to}`);
    
    // 2. 呼叫 Resend API 寄信
    // 免費帳戶預設發件人必須是 onboarding@resend.dev
    const { data, error } = await resend.emails.send({
      from: '資產監控系統 <onboarding@resend.dev>',
      to: to,
      subject: subject || '價格警報通知',
      text: text || '系統觸發通知',
    });

    if (error) {
      console.error('Resend 平台內部發信失敗:', error);
      return res.status(400).json({ error: '發信失敗', details: error });
    }

    console.log('Resend 寄信成功，郵件 ID:', data.id);
    return res.status(200).json({ success: true, messageId: data.id });

  } catch (err) {
    console.error('伺服器未預期錯誤:', err);
    return res.status(500).json({ error: '伺服器內部錯誤', message: err.message });
  }
}
