import { api, apiHelpers } from './api';
import { PurchaseData, PaymentResult, PaymentMethod } from '../types';

class PaymentService {
  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiHelpers.getPaymentMethods();
      return response.data?.methods || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // Purchase ticket
  async purchaseTicket(purchaseData: PurchaseData): Promise<PaymentResult> {
    try {
      const response = await apiHelpers.purchaseTicket(purchaseData);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('Purchase ticket error:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: error.response?.data?.message || 'Erreur lors de l\'achat du billet'
      };
    }
  }

  // Verify payment status
  async verifyPayment(transactionId: string) {
    try {
      const response = await apiHelpers.verifyPayment(transactionId);
      return response;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  }

  // Redirect to InTouch payment page
  redirectToInTouch(paymentData: any) {
    const intouchUrl = import.meta.env.VITE_INTOUCH_REDIRECT_URL || 'https://touchpay.gutouch.net/touchpayv2/';
    
    // Create form data for InTouch
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = intouchUrl;
    form.style.display = 'none';

    // Add payment parameters
    const params = {
      merchantId: import.meta.env.VITE_INTOUCH_MERCHANT_ID,
      secretKey: import.meta.env.VITE_INTOUCH_SECRET_KEY,
      amount: paymentData.totalPrice,
      transactionId: paymentData.transactionId,
      returnUrl: `${window.location.origin}/payment-success`,
      cancelUrl: `${window.location.origin}/payment-cancel`,
      recipientNumber: paymentData.recipientNumber,
      recipientEmail: paymentData.recipientEmail,
      recipientName: `${paymentData.recipientFirstName} ${paymentData.recipientLastName}`
    };

    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value?.toString() || '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  // Open InTouch payment window
  openInTouchPayment(paymentData: any): void {
    const intouchUrl = 'https://touchpay.gutouch.net/touchpayv2/';
    
    if (!intouchUrl) {
      console.error('InTouch URL not configured');
      return;
    }

    // Create the InTouch payment HTML
    const paymentHtml = this.generateInTouchHTML(paymentData);
    
    // Open in new window
    const paymentWindow = window.open('', 'InTouchPayment', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (paymentWindow) {
      paymentWindow.document.write(paymentHtml);
      paymentWindow.document.close();
      
      // Monitor payment window
      this.monitorPaymentWindow(paymentWindow, paymentData.transactionId);
    } else {
      // Fallback: redirect in same window
      window.location.href = intouchUrl;
    }
  }

  // Generate InTouch payment HTML
  private generateInTouchHTML(paymentData: any): string {
    const merchantId = 'KANZ26379';
    const secretKey = '2H7og9Kc2yFTvf0nJK0EoH8yjHynAUPxlauNn5jchsFFchaNeL';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Paiement Kanzey.co - InTouch</title>
        <script src="https://touchpay.gutouch.net/touchpayv2/script/touchpaynr/prod_touchpay-0.0.1.js" type="text/javascript"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .payment-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FFD700;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
          }
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px dashed #FFD700;
          }
          .payment-btn {
            background: #2A538B;
            color: white;
            border: none;
            border-radius: 8px;
            height: 50px;
            padding: 0 40px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s;
            margin: 20px 0;
          }
          .payment-btn:hover {
            background: #1e3f6f;
            transform: translateY(-2px);
          }
          .info {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
            line-height: 1.5;
          }
          .spinner {
            display: none;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #FFD700;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            font-weight: bold;
          }
          .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
        </style>
        <script type="text/javascript">
          let paymentInitiated = false;
          
          function initiatePayment() {
            if (paymentInitiated) return;
            paymentInitiated = true;
            
            document.getElementById('paymentBtn').style.display = 'none';
            document.getElementById('spinner').style.display = 'block';
            document.getElementById('status').innerHTML = '<div class="status">⏳ Traitement du paiement en cours...</div>';
            
            try {
              sendPaymentInfos(
                new Date().getTime(),
                '${merchantId}',
                '${secretKey}',
                'Kanzey.co',
                '',
                '',
                ${paymentData.totalPrice},
                'Dakar',
                '', '', '', ''
              );
            } catch (error) {
              console.error('Payment error:', error);
              document.getElementById('status').innerHTML = '<div class="status error">❌ Erreur lors du paiement. Veuillez réessayer.</div>';
              document.getElementById('spinner').style.display = 'none';
              document.getElementById('paymentBtn').style.display = 'block';
              paymentInitiated = false;
            }
          }
          
          function handlePaymentSuccess() {
            document.getElementById('status').innerHTML = '<div class="status success">✅ Paiement réussi ! Redirection...</div>';
            document.getElementById('spinner').style.display = 'none';
            
            setTimeout(() => {
              window.opener?.postMessage({
                type: 'PAYMENT_SUCCESS',
                transactionId: '${paymentData.transactionId}'
              }, '*');
              window.close();
            }, 2000);
          }
          
          function handlePaymentError() {
            document.getElementById('status').innerHTML = '<div class="status error">❌ Paiement échoué. Veuillez réessayer.</div>';
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('paymentBtn').style.display = 'block';
            paymentInitiated = false;
          }
          
          // Monitor payment status
          window.addEventListener('message', function(event) {
            if (event.data?.type === 'PAYMENT_COMPLETED') {
              handlePaymentSuccess();
            } else if (event.data?.type === 'PAYMENT_FAILED') {
              handlePaymentError();
            }
          });
        </script>
      </head>
      <body>
        <div class="payment-container">
          <div class="logo">🎟️ Kanzey.co</div>
          <div class="title">Paiement sécurisé</div>
          
          <div class="amount">${paymentData.totalPrice} FCFA</div>
          
          <p><strong>Événement:</strong> ${paymentData.eventTitle}</p>
          <p><strong>Quantité:</strong> ${paymentData.quantity} billet(s)</p>
          
          <div class="spinner" id="spinner"></div>
          
          <button class="payment-btn" id="paymentBtn" onclick="initiatePayment()">
            Continuer le paiement
          </button>
          
          <div id="status"></div>
          
          <div class="info">
            <p>💳 Paiement sécurisé par InTouch</p>
            <p>🔒 Vos données sont protégées</p>
            <p>📱 Compatible Orange Money, Free Money, Wave</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Monitor payment window for completion
  private monitorPaymentWindow(paymentWindow: Window, transactionId: string): void {
    const checkClosed = setInterval(() => {
      if (paymentWindow.closed) {
        clearInterval(checkClosed);
        // Window closed - check payment status
        this.verifyPayment(transactionId).then((result) => {
          if (result.success && result.data.ticket.isPaid) {
            window.location.href = '/payment-success';
          } else {
            // Payment not completed - could be cancelled
            console.log('Payment window closed without completion');
          }
        }).catch(console.error);
      }
    }, 1000);

    // Listen for payment completion messages
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'PAYMENT_SUCCESS' && event.data.transactionId === transactionId) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        paymentWindow.close();
        window.location.href = '/payment-success';
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Cleanup after 10 minutes
    setTimeout(() => {
      clearInterval(checkClosed);
      window.removeEventListener('message', messageHandler);
      if (!paymentWindow.closed) {
        paymentWindow.close();
      }
    }, 10 * 60 * 1000);
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'FCFA'): string {
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
  }

  // Get payment method icon
  getPaymentMethodIcon(method: string): string {
    const icons: { [key: string]: string } = {
      orange_money: '🟠',
      free_money: '🔵',
      wave: '💙',
      touch_point: '💳'
    };
    return icons[method] || '💳';
  }

  // Get payment status color
  getPaymentStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
      cancelled: 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  }
}

export const paymentService = new PaymentService();
export default paymentService;