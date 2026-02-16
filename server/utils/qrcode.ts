import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a365d',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
}
