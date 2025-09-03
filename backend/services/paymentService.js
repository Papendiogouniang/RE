import axios from 'axios';

class PaymentService {
  constructor() {
    this.baseURL = process.env.INTOUCH_API_URL;
    this.merchantId = process.env.INTOUCH_MERCHANT_ID;
    this.loginAgent = process.env.INTOUCH_LOGIN_AGENT;
    this.passwordAgent = process.env.INTOUCH_PASSWORD_AGENT;
    this.username = process.env.INTOUCH_USERNAME;
    this.password = process.env.INTOUCH_PASSWORD;
  }

  async initiatePayment(paymentData) {
    try {
      const {
        amount,
        recipientNumber,
        recipientEmail,
        recipientFirstName,
        recipientLastName,
        serviceCode = 'PAIEMENTMARCHANDOMQRCODE',
        callback,
        idFromClient
      } = paymentData;

      const requestBody = {
        idFromClient: idFromClient || `KANZEY-${Date.now()}`,
        additionnalInfos: {
          recipientEmail,
          recipientFirstName,
          recipientLastName,
          destinataire: recipientNumber,
          partner_name: "KANZEY.CO",
          return_url: `${process.env.FRONTEND_URL}/payment-success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
        },
        amount,
        callback,
        recipientNumber,
        serviceCode
      };

      const url = `${this.baseURL}/${this.merchantId}/transaction?loginAgent=${this.loginAgent}&passwordAgent=${this.passwordAgent}`;

      const config = {
        method: 'PUT',
        url,
        headers: { 'Content-Type': 'application/json' },
        auth: { username: this.username, password: this.password },
        data: requestBody
      };

      console.log('🔄 Initiation paiement InTouch:', { amount, recipientNumber, serviceCode });
      const response = await axios(config);
      console.log('✅ Réponse InTouch:', response.data);

      return {
        success: true,
        data: response.data,
        transactionId: response.data.transactionId || response.data.id,
        paymentUrl: response.data.paymentUrl || null,
        status: response.data.status || 'pending'
      };

    } catch (error) {
      console.error('❌ Erreur paiement InTouch:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Erreur lors de l\'initiation du paiement'
      };
    }
  }

  async verifyPayment(transactionId) {
    try {
      const url = `${this.baseURL}/${this.merchantId}/transaction/${transactionId}?loginAgent=${this.loginAgent}&passwordAgent=${this.passwordAgent}`;
      const config = {
        method: 'GET',
        url,
        headers: { 'Content-Type': 'application/json' },
        auth: { username: this.username, password: this.password }
      };

      const response = await axios(config);
      console.log('✅ Vérification paiement InTouch:', response.data);

      return {
        success: true,
        data: response.data,
        status: response.data.status,
        isPaid: response.data.status === 'SUCCESSFUL' || response.data.status === 'completed'
      };

    } catch (error) {
      console.error('❌ Erreur vérification paiement:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async handleCallback(callbackData) {
    try {
      console.log('📞 Callback reçu:', callbackData);

      const { transactionId, status, amount, currency, idFromClient, additionnalInfos } = callbackData;
      const statusMapping = {
        'SUCCESSFUL': 'completed',
        'SUCCESS': 'completed',
        'COMPLETED': 'completed',
        'FAILED': 'failed',
        'CANCELLED': 'cancelled',
        'PENDING': 'processing'
      };

      const mappedStatus = statusMapping[status?.toUpperCase()] || 'processing';

      return {
        success: true,
        transactionId,
        status: mappedStatus,
        amount,
        currency,
        idFromClient,
        isPaid: mappedStatus === 'completed',
        rawData: callbackData
      };

    } catch (error) {
      console.error('❌ Erreur traitement callback:', error);
      return { success: false, error: error.message };
    }
  }

  // Génération du HTML pour InTouch (remplacé private par _)
  _generateInTouchHTML(paymentData) {
    const merchantId = process.env.VITE_INTOUCH_MERCHANT_ID || 'KANZ26379';
    const secretKey = process.env.VITE_INTOUCH_SECRET_KEY || '2H7og9Kc2yFTvf0nJK0EoH8yjHynAUPxlauNn5jchsFFchaNeL';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Paiement Kanzey.co - InTouch</title>
        <script src="https://touchpay.gutouch.net/touchpayv2/script/touchpaynr/prod_touchpay-0.0.1.js"></script>
      </head>
      <body>
        <script>
          let paymentInitiated = false;
          function initiatePayment() {
            if(paymentInitiated) return;
            paymentInitiated = true;
            document.getElementById('status').innerHTML = 'Traitement du paiement...';
            try {
              sendPaymentInfos(
                new Date().getTime(),
                '${merchantId}',
                '${secretKey}',
                'Kanzey.co',
                '',
                '',
                ${paymentData.totalPrice},
                'Dakar','','','','',''
              );
            } catch(e){
              console.error('Payment error',e);
            }
          }
        </script>
      </body>
      </html>
    `;
  }

  async initiateOrangeMoney(paymentData) { return this.initiatePayment({...paymentData, serviceCode:'PAIEMENTMARCHANDOMSN2'}); }
  async initiateFreeMoney(paymentData) { return this.initiatePayment({...paymentData, serviceCode:'PAIEMENTMARCHANDTIGO'}); }
  async initiateWave(paymentData) { return this.initiatePayment({...paymentData, serviceCode:'SNPAIEMENTWAVE'}); }
  async initiateTouchPoint(paymentData) { return this.initiatePayment({...paymentData, serviceCode:'SN_INIT_PAIEMENT_TP'}); }
}

export default new PaymentService();
