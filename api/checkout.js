const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  const { products, coupon } = req.query;

  if (!products) {
    return res.status(400).send('No products specified');
  }

  const line_items = products.split(',').map(entry => {
    const [catalog_object_id, quantity] = entry.split(':');
    return { catalog_object_id, quantity: quantity || '1' };
  });

  const body = JSON.stringify({
    idempotency_key: randomUUID(),
    order: {
      location_id: process.env.SQUARE_LOCATION_ID,
      line_items,
    },
  });

  try {
    const response = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square error:', JSON.stringify(data));
      return res.status(500).send('Failed to create checkout session');
    }

    res.redirect(302, data.payment_link.url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create checkout session');
  }
};
