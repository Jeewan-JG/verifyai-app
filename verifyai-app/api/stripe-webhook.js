import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Service role key bypasses RLS so we can update any user
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Disable Vercel's automatic body parsing — Stripe signature verification
// requires the raw request body as a Buffer, not a parsed JS object.
export const config = {
  api: { bodyParser: false }
}

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await readRawBody(req)
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.client_reference_id
    const plan = session.metadata?.plan ?? 'starter'

    if (userId) {
      // Write to app_metadata (service-role only) so users cannot self-modify their plan status
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { plan: 'paid', paid_plan: plan }
      })
      if (error) console.error('Supabase update error:', error.message)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const userId = sub.metadata?.userId

    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { plan: 'expired' }
      })
      if (error) console.error('Supabase update error:', error.message)
    }
  }

  return res.status(200).json({ received: true })
}
