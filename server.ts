import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON bodies up to 50MB for PDF transmission
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'TOKİ Cumhuriyet Anadolu Lisesi Toplu Mail App V1',
      time: new Date().toISOString(),
    });
  });

  // Test SMTP connection
  app.post('/api/test-smtp', async (req, res) => {
    try {
      const { host, port, user, appPassword, secure, simulationMode } = req.body;

      if (simulationMode || !user || !appPassword) {
        // Simulated verification
        return res.json({
          success: true,
          simulated: true,
          message: 'Simülasyon Modu: SMTP bağlantısı ve kimlik doğrulama başarıyla simüle edildi (Test Hazır).',
        });
      }

      const transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port: port || 465,
        secure: secure !== undefined ? secure : true,
        auth: {
          user: user.trim(),
          pass: appPassword.replace(/\s+/g, ''),
        },
        connectionTimeout: 10000,
      });

      await transporter.verify();

      return res.json({
        success: true,
        simulated: false,
        message: `Gmail SMTP sunucusuna (${user}) başarıyla bağlanıldı ve yetkilendirildi.`,
      });
    } catch (err: any) {
      console.error('SMTP test error:', err);
      return res.status(400).json({
        success: false,
        message: err?.message || 'SMTP kimlik doğrulama hatası. Lütfen 16 haneli Gmail Uygulama Şifrenizi kontrol ediniz.',
      });
    }
  });

  // Send single email with PDF attachment
  app.post('/api/send-email', async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        to,
        teacherName,
        subject,
        text,
        html,
        pdfBase64,
        filename,
        smtpSettings,
      } = req.body;

      if (!to || !to.includes('@')) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Geçersiz alıcı e-posta adresi.',
        });
      }

      // Check if simulation mode or no app password
      const isSimulation =
        smtpSettings?.simulationMode ||
        !smtpSettings?.appPassword ||
        !smtpSettings?.user;

      if (isSimulation) {
        // Simulate real SMTP delay
        const delay = Math.max(300, (smtpSettings?.delayPerMailSeconds || 1.5) * 600);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return res.json({
          success: true,
          simulated: true,
          messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          durationMs: Date.now() - startTime,
          to,
          teacherName,
        });
      }

      // Real Nodemailer transport
      const transporter = nodemailer.createTransport({
        host: smtpSettings.host || 'smtp.gmail.com',
        port: smtpSettings.port || 465,
        secure: smtpSettings.secure !== false,
        auth: {
          user: smtpSettings.user.trim(),
          pass: smtpSettings.appPassword.replace(/\s+/g, ''),
        },
      });

      const attachments = [];
      if (pdfBase64) {
        // Strip data:application/pdf;base64, prefix if present
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        attachments.push({
          filename: filename || `${teacherName.replace(/\s+/g, '_')}_Ders_Programi.pdf`,
          content: Buffer.from(cleanBase64, 'base64'),
          contentType: 'application/pdf',
        });
      }

      const mailOptions = {
        from: `"${smtpSettings.senderName || 'TOKİ Cumhuriyet Anadolu Lisesi'}" <${smtpSettings.user}>`,
        to,
        replyTo: smtpSettings.replyTo || smtpSettings.user,
        subject: subject || 'Haftalık Ders Programınız',
        text,
        html: html || `<p>${text.replace(/\n/g, '<br/>')}</p>`,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        simulated: false,
        messageId: info.messageId,
        durationMs: Date.now() - startTime,
        to,
        teacherName,
      });
    } catch (err: any) {
      console.error('Email send error:', err);
      return res.status(500).json({
        success: false,
        errorMessage: err?.message || 'E-posta iletimi sırasında bir sunucu hatası oluştu.',
        durationMs: Date.now() - startTime,
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
