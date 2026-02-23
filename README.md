# Biyo Backend — Phase 1

Creator monetization platform backend. Built with Node.js, Express, PostgreSQL, Razorpay, and OpenAI.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Run the database schema
psql -U your_user -d biyo -f schema.sql

# 4. Start dev server
npm run dev
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `RAZORPAY_KEY_ID` | Biyo platform Razorpay key |
| `RAZORPAY_KEY_SECRET` | Biyo platform Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret |
| `RAZORPAY_PLAN_ID` | ₹299/month plan ID from Razorpay dashboard |
| `OPENAI_API_KEY` | OpenAI API key |
| `FILE_STORAGE_URL` | Base URL for uploaded files |

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new creator |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/profile` | ✅ | Update profile + Razorpay keys |

### Public Store
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/store/:username` | ❌ | Public store view |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/products` | ✅ + Sub | Create product |
| GET | `/products` | ✅ | List my products |
| PUT | `/products/:id` | ✅ | Update product |
| DELETE | `/products/:id` | ✅ | Delete product |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-order` | ✅ | Create Razorpay order |
| POST | `/payments/webhook/razorpay` | ❌ | Razorpay webhook handler |

### Free Downloads / Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/leads/free-download` | ❌ | Download free product + capture email |

### Audience
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audience` | ✅ | Get leads + buyers. Query: `?filter=lead\|buyer&search=email` |

### Income
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/income/summary` | ✅ | Total, monthly, today earnings |
| GET | `/income/orders` | ✅ | Paginated orders. Query: `?page=1&limit=20` |

### Biyo Subscription
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/subscriptions/create` | ✅ | Subscribe to Biyo (₹299/mo) |
| POST | `/subscriptions/webhook` | ❌ | Handle subscription events |

### AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai/product-builder` | ✅ | Generate product from idea |
| POST | `/ai/automation-builder` | ✅ | Generate automation from description |

### Automations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/automations` | ✅ | Create automation |
| GET | `/automations` | ✅ | List automations |
| PUT | `/automations/:id` | ✅ | Update automation |

---

## Event Flows

### Paid Product Purchase
```
Customer → POST /payments/create-order
         → Razorpay order created (uses creator's Razorpay keys)
         → Customer pays on frontend
         → Razorpay → POST /payments/webhook/razorpay
         → Signature verified
         → Order status → 'paid'
         → triggerAutomation('purchase', ...)
         → file_url available for download
```

### Free Download
```
Customer → POST /leads/free-download { product_id, email }
         → Email saved to leads table
         → triggerAutomation('free_download', ...)
         → file_url returned to customer
```

### Biyo Subscription
```
Creator → POST /subscriptions/create
        → Razorpay subscription created (Biyo's keys)
        → Creator pays ₹299/month
        → Razorpay → POST /subscriptions/webhook
        → Signature verified
        → users.subscription_status → 'active'
        → Creator can now publish products
```

---

## Security

- All creator routes protected with JWT middleware
- All product/automation mutations check ownership (`WHERE id = ? AND user_id = req.user.id`)
- Razorpay webhooks verified with HMAC SHA256 signature
- Subscription guard on `POST /products`
- Passwords hashed with bcrypt (12 rounds)
- password_hash and razorpay_key_secret never returned in API responses

---

## Phase 2 Roadmap
- Real email delivery in automation triggers (Resend/Nodemailer)
- File upload endpoint (S3/Cloudflare R2)
- Creator analytics dashboard data
- Referral system
- Instagram DM automation via Meta API
