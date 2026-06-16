import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICES = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_annual:  process.env.STRIPE_PRICE_STARTER_ANNUAL,
  agency_monthly:  process.env.STRIPE_PRICE_AGENCY_MONTHLY,
  agency_annual:   process.env.STRIPE_PRICE_AGENCY_ANNUAL,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { plan, annual, userId, email } = req.body

  const priceKey = `${plan}_${annual ? 'annual' : 'monthly'}`
  const priceId = PRICES[priceKey]

  if (!priceId) {
    return res.status(400).json({ error: `Unknown plan: ${priceKey}` })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${process.env.VITE_APP_URL}/pricing?success=true`,
      cancel_url:  `${process.env.VITE_APP_URL}/pricing?cancelled=true`,
      metadata: { userId, plan, annual: annual ? 'true' : 'false' },
      subscription_data: {
        metadata: { userId, plan },
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
