import crypto from 'crypto';

/**
 * Verifies the HMAC signature of a Shopify webhook request.
 * Throws an error if the HMAC is missing or invalid.
 * 
 * @param headers - The Headers object from the incoming NextRequest.
 * @param rawBody - The raw, unparsed request body as a string.
 * @returns {Promise<void>} - Resolves if valid, otherwise throws an error.
 */
export async function verifyShopifyHmac(headers: Headers, rawBody: string): Promise<void> {
  const hmac = headers.get('x-shopify-hmac-sha256');
  
  if (!hmac) {
    throw new Error('Could not verify webhook: Missing x-shopify-hmac-sha256 header.');
  }

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Error('SHOPIFY_API_SECRET is not configured. Cannot verify webhook.');
  }

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  const generatedHmacBuffer = Buffer.from(generatedHash);
  const receivedHmacBuffer = Buffer.from(hmac);

  // Use timingSafeEqual to prevent timing attacks
  if (!crypto.timingSafeEqual(generatedHmacBuffer, receivedHmacBuffer)) {
    throw new Error('Could not verify webhook: Invalid HMAC signature.');
  }

  // If we reach here, the HMAC is valid.
}
