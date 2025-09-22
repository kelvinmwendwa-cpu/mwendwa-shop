import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  CALLBACK_URL
} = process.env;

const getAccessToken = async () => {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });

  const text = await res.text();
  if (!text || text.trim() === '') {
    console.error('❌ Empty OAuth response. Check sandbox credentials.');
    return null;
  }

  console.log('OAuth response:', text);
  const data = JSON.parse(text);
  return data.access_token;
};

app.post('/pay', async (req, res) => {
  const { phone, amount, orderId } = req.body;

  try {
    const token = await getAccessToken();
    if (!token) {
      return res.json({ ok: false, message: 'Failed to get access token' });
    }

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: orderId,
      TransactionDesc: 'Mwendwa Shop Sandbox Payment'
    };

    const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await stkRes.json();
    console.log('STK Push response:', data);

    const order = {
      orderId,
      phone,
      amount,
      timestamp: new Date().toISOString(),
      status: 'Pending'
    };

    fs.readFile('orders.json', (err, fileData) => {
      const orders = err ? [] : JSON.parse(fileData);
      orders.push(order);
      fs.writeFile('orders.json', JSON.stringify(orders, null, 2), () => {
        console.log('✅ Order saved to orders.json');
      });
    });

    res.json({ ok: true, data });
  } catch (err) {
    console.error('STK Push error:', err);
    res.json({ ok: false, message: 'STK Push failed', error: err.message });
  }
});

app.get('/orders', (req, res) => {
  fs.readFile('orders.json', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

app.listen(8080, () => {
  console.log('✅ Sandbox server running on http://localhost:8080');
});