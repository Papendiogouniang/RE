import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import pdfService from './pdfService.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      }
    });
  }

  async sendTicketEmail(user, ticket, event) {
    try {
      // Générer le PDF du billet
      const pdfResult = await pdfService.generateTicketPDF(user, ticket, event);
      
      // Générer le QR code
      const qrCodeDataURL = await QRCode.toDataURL(ticket.qrCode.data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const htmlTemplate = this.getTicketEmailTemplate(user, ticket, event, qrCodeDataURL);

      const mailOptions = {
        from: `"Kanzey.co" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `🎟️ Votre billet pour ${event.title}`,
        html: htmlTemplate,
        attachments: [
          {
            filename: `billet-${ticket.ticketId}.pdf`,
            path: pdfResult.filePath,
            contentType: 'application/pdf'
          },
          {
            filename: 'qrcode.png',
            content: qrCodeDataURL.split(',')[1],
            encoding: 'base64',
            cid: 'qrcode'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      
      // Marquer l'email comme envoyé
      ticket.isEmailSent = true;
      ticket.emailSentAt = new Date();
      await ticket.save();

      console.log(`✅ Email de billet envoyé à ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi d\'email:', error);
      throw error;
    }
  }

  getTicketEmailTemplate(user, ticket, event, qrCodeDataURL) {
    const eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Votre billet Kanzey.co</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .ticket-info {
          padding: 30px;
          background: #ffffff;
        }
        .ticket-card {
          border: 2px dashed #FFD700;
          border-radius: 15px;
          padding: 25px;
          margin: 20px 0;
          background: #fefefe;
        }
        .event-title {
          color: #333;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          text-align: center;
        }
        .ticket-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .detail-item {
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .detail-label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-value {
          color: #333;
          font-size: 14px;
          margin-top: 4px;
        }
        .qr-section {
          text-align: center;
          padding: 30px;
          background: #f8f9fa;
          border-radius: 10px;
          margin: 20px 0;
        }
        .qr-code {
          background: white;
          padding: 20px;
          border-radius: 10px;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .instructions {
          background: #e8f4fd;
          border-left: 4px solid #FFD700;
          padding: 20px;
          margin: 20px 0;
        }
        .footer {
          background: #333;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .footer a {
          color: #FFD700;
          text-decoration: none;
        }
        .ticket-id {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          color: #FFD700;
          background: #000;
          padding: 10px;
          border-radius: 5px;
          text-align: center;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎟️ Kanzey.co</h1>
          <p>Votre billet électronique</p>
        </div>
        
        <div class="ticket-info">
          <div class="ticket-card">
            <div class="event-title">${event.title}</div>
            
            <div class="ticket-id">ID: ${ticket.ticketId}</div>
            
            <div class="ticket-details">
              <div class="detail-item">
                <div class="detail-label">Détenteur</div>
                <div class="detail-value">${user.fullName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${user.email}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date & Heure</div>
                <div class="detail-value">${eventDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Lieu</div>
                <div class="detail-value">${event.location.name}, ${event.location.city}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Quantité</div>
                <div class="detail-value">${ticket.quantity} billet(s)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Prix Total</div>
                <div class="detail-value">${ticket.totalPrice.toLocaleString()} ${ticket.currency}</div>
              </div>
            </div>
          </div>
          
          <div class="qr-section">
            <h3>Code QR de validation</h3>
            <p>Présentez ce code QR à l'entrée de l'événement</p>
            <div class="qr-code">
              <img src="cid:qrcode" alt="QR Code" width="200" height="200">
            </div>
          </div>
          
          <div class="instructions">
            <h4>📱 Instructions importantes :</h4>
            <ul>
              <li>Présentez ce QR code (sur votre téléphone ou imprimé) à l'entrée</li>
              <li>Arrivez au moins 30 minutes avant le début de l'événement</li>
              <li>Ce billet est personnel et ne peut être utilisé qu'une seule fois</li>
              <li>Conservez ce email jusqu'à la fin de l'événement</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Kanzey.co</strong> - La plateforme sénégalaise de billetterie événementielle</p>
          <p>🌍 <a href="https://kanzey.co">www.kanzey.co</a> | 📧 contact@kanzey.co</p>
          <p>Merci de votre confiance ! 🇸🇳</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: `"Kanzey.co" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: '🎉 Bienvenue sur Kanzey.co !',
        html: this.getWelcomeEmailTemplate(user)
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    }
  }

  getWelcomeEmailTemplate(user) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Kanzey.co</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #FFD700; color: #000; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
        .btn { background: #FFD700; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bienvenue sur Kanzey.co !</h1>
        </div>
        <div class="content">
          <h2>Salut ${user.firstName} !</h2>
          <p>Nous sommes ravis de vous accueillir sur <strong>Kanzey.co</strong>, la première plateforme sénégalaise de billetterie événementielle !</p>
          
          <h3>🎯 Ce que vous pouvez faire :</h3>
          <ul>
            <li>🎫 Découvrir et acheter des billets pour les meilleurs événements du Sénégal</li>
            <li>🎭 Explorer des concerts, spectacles, conférences et festivals</li>
            <li>📱 Recevoir vos billets électroniques avec QR code</li>
            <li>⚡ Payer facilement avec les solutions de paiement locales</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}" class="btn">🚀 Découvrir les événements</a>
          </div>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter !</p>
          
          <p>Cordialement,<br>L'équipe Kanzey.co 🇸🇳</p>
        </div>
        <div class="footer">
          <p>Kanzey.co - La billetterie du Sénégal</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

export default new EmailService();