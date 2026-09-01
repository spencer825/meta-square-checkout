const { Client, Environment } = require('square');
const { randomUUID } = require('crypto');

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
});

module.exports = async (req, res) => {
  const { products, coupon } = req.query;

  if (!products) {
    return res.status(400).send('No products specified');
  }

  const lineItems = products.split(',').map(entry => {
    const parts = entry.split(':');
    return {
      catalogObjectId: parts[0],
      quantity: parts[1] || '1',
    };
  });

  try {
    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: randomUUID(),
      order: {
        order: {
          locationId: process.env.SQUARE_LOCATION_ID,
          lineItems,
        },
      },
    });

    res.redirect(302, result.paymentLink.url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create checkout session');
  }
};
