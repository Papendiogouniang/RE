import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';

class PDFService {
  async generateTicketPDF(user, ticket, event) {
    try {
      // Créer le répertoire de sortie s'il n'existe pas
      const outputDir = path.join(process.cwd(), 'uploads', 'tickets');
      await fs.mkdir(outputDir, { recursive: true });

      // Générer le QR code en buffer
      const qrCodeBuffer = await QRCode.toBuffer(ticket.qrCode.data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Créer le document PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `Billet - ${event.title}`,
          Author: 'Kanzey.co',
          Subject: `Billet pour ${event.title}`,
          Creator: 'Kanzey.co - Plateforme de billetterie sénégalaise'
        }
      });

      // Nom du fichier
      const fileName = `ticket-${ticket.ticketId}.pdf`;
      const filePath = path.join(outputDir, fileName);

      // Stream vers le fichier
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // === HEADER ===
      // Logo et titre
      doc.fontSize(28)
         .fillColor('#FFD700')
         .text('🎟️ Kanzey.co', 50, 50);

      doc.fontSize(16)
         .fillColor('#000000')
         .text('Billet Électronique', 50, 85);

      // Ligne de séparation
      doc.moveTo(50, 110)
         .lineTo(545, 110)
         .strokeColor('#FFD700')
         .lineWidth(3)
         .stroke();

      // === INFORMATIONS ÉVÉNEMENT ===
      let yPosition = 140;

      // Titre de l'événement
      doc.fontSize(24)
         .fillColor('#000000')
         .text(event.title, 50, yPosition, { width: 495, align: 'center' });

      yPosition += 50;

      // Cadre principal du billet
      doc.rect(50, yPosition, 495, 300)
         .strokeColor('#FFD700')
         .lineWidth(2)
         .dash(5, { space: 5 })
         .stroke();

      yPosition += 30;

      // ID du billet
      doc.fontSize(14)
         .fillColor('#666666')
         .text('ID BILLET:', 70, yPosition);

      doc.fontSize(16)
         .fillColor('#000000')
         .font('Courier')
         .text(ticket.ticketId, 200, yPosition);

      doc.font('Helvetica');
      yPosition += 40;

      // Informations en deux colonnes
      const leftColumn = 70;
      const rightColumn = 320;

      // Colonne gauche
      doc.fontSize(12)
         .fillColor('#666666')
         .text('DÉTENTEUR:', leftColumn, yPosition);
      doc.fontSize(14)
         .fillColor('#000000')
         .text(user.fullName, leftColumn, yPosition + 15);

      doc.fontSize(12)
         .fillColor('#666666')
         .text('EMAIL:', leftColumn, yPosition + 45);
      doc.fontSize(14)
         .fillColor('#000000')
         .text(user.email, leftColumn, yPosition + 60);

      doc.fontSize(12)
         .fillColor('#666666')
         .text('QUANTITÉ:', leftColumn, yPosition + 90);
      doc.fontSize(14)
         .fillColor('#000000')
         .text(`${ticket.quantity} billet(s)`, leftColumn, yPosition + 105);

      // Colonne droite
      const eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.fontSize(12)
         .fillColor('#666666')
         .text('DATE & HEURE:', rightColumn, yPosition);
      doc.fontSize(14)
         .fillColor('#000000')
         .text(eventDate, rightColumn, yPosition + 15, { width: 200 });

      doc.fontSize(12)
         .fillColor('#666666')
         .text('LIEU:', rightColumn, yPosition + 45);
      doc.fontSize(14)
         .fillColor('#000000')
         .text(`${event.location.name}`, rightColumn, yPosition + 60, { width: 200 });
      doc.text(`${event.location.city}`, rightColumn, yPosition + 75, { width: 200 });

      doc.fontSize(12)
         .fillColor('#666666')
         .text('PRIX TOTAL:', rightColumn, yPosition + 105);
      doc.fontSize(16)
         .fillColor('#FFD700')
         .text(`${ticket.totalPrice.toLocaleString()} ${ticket.currency}`, rightColumn, yPosition + 120);

      // === QR CODE SECTION ===
      yPosition += 180;

      // Titre QR Code
      doc.fontSize(16)
         .fillColor('#000000')
         .text('Code QR de Validation', 50, yPosition, { width: 495, align: 'center' });

      yPosition += 30;

      // Cadre QR Code
      const qrX = 250;
      const qrY = yPosition;
      
      doc.rect(qrX - 110, qrY - 10, 220, 240)
         .fillColor('#F8F9FA')
         .fill();

      doc.rect(qrX - 110, qrY - 10, 220, 240)
         .strokeColor('#FFD700')
         .lineWidth(2)
         .stroke();

      // Insérer le QR code
      doc.image(qrCodeBuffer, qrX - 100, qrY, { width: 200, height: 200 });

      yPosition += 220;

      // Instructions
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Présentez ce code QR à l\'entrée de l\'événement', 50, yPosition, { 
           width: 495, 
           align: 'center' 
         });

      // === INSTRUCTIONS ===
      yPosition += 50;

      doc.fontSize(14)
         .fillColor('#FFD700')
         .text('📱 INSTRUCTIONS IMPORTANTES', 50, yPosition);

      yPosition += 25;

      const instructions = [
        '• Présentez ce QR code (sur votre téléphone ou imprimé) à l\'entrée',
        '• Arrivez au moins 30 minutes avant le début de l\'événement',
        '• Ce billet est personnel et ne peut être utilisé qu\'une seule fois',
        '• Conservez ce document jusqu\'à la fin de l\'événement'
      ];

      doc.fontSize(11)
         .fillColor('#333333');

      instructions.forEach(instruction => {
        doc.text(instruction, 50, yPosition, { width: 495 });
        yPosition += 20;
      });

      // === FOOTER ===
      yPosition += 30;

      doc.fontSize(10)
         .fillColor('#666666')
         .text('Kanzey.co - La plateforme sénégalaise de billetterie événementielle', 50, yPosition, {
           width: 495,
           align: 'center'
         });

      doc.text('🌍 www.kanzey.co | 📧 contact@kanzey.co | 🇸🇳 Dakar, Sénégal', 50, yPosition + 15, {
        width: 495,
        align: 'center'
      });

      // Finaliser le PDF
      doc.end();

      // Attendre que le fichier soit écrit
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      return {
        success: true,
        filePath,
        fileName,
        url: `/uploads/tickets/${fileName}`
      };

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      throw error;
    }
  }

  async deleteTicketPDF(fileName) {
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'tickets', fileName);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression PDF:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PDFService();