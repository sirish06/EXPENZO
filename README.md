#  Expenzo — Smart Expense Splitting

A full-stack MERN expense splitter with JWT auth, real-time updates, smart debt simplification, and a modern fintech UI.

---

##  Quick Start (Run Locally)

### Prerequisites
- Node.js (v18+) — https://nodejs.org
- MongoDB installed locally (or MongoDB Atlas)
- VS Code

---

## Step 1 — Install Backend Dependencies

Open a terminal in VS Code:

```bash
cd backend
npm install
```

## Step 2 — Configure Backend Environment

The `.env` file is already created for you at `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-splitter
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

> ✅ If MongoDB is installed locally, no changes needed.
> If using MongoDB Atlas, replace MONGO_URI with your Atlas connection string.

## Step 3 — Install Frontend Dependencies

Open a **second** terminal in VS Code:

```bash
cd frontend
npm install
```

---

## Step 4 — Run the App

### Terminal 1 — Start Backend:
```bash
cd backend
npm run dev
```
You should see:
```
 Server running on port 5000
 MongoDB Connected: localhost
```

### Terminal 2 — Start Frontend:
```bash
cd frontend
npm run dev
```
You should see:
```
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser 🎉

---

##  Project Structure

```
expense-splitter/
├── backend/
│   ├── config/         ← MongoDB connection
│   ├── controllers/    ← Business logic
│   ├── middleware/     ← JWT auth + error handling
│   ├── models/         ← Mongoose schemas
│   ├── routes/         ← Express routes
│   ├── .env            ← Environment variables
│   └── server.js       ← Entry point
│
└── frontend/
    └── src/
        ├── components/ ← Navbar, Logo, ActivityFeed
        ├── context/    ← Auth + Theme context
        ├── pages/      ← All page components
        ├── routes/     ← Protected route
        ├── services/   ← Axios API calls
        └── App.jsx     ← Router
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/auth/users | Get all users |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/groups/create | Create group |
| GET | /api/groups | Get my groups |
| GET | /api/groups/:id | Get group by ID |
| PUT | /api/groups/:id | Update group |
| DELETE | /api/groups/:id | Delete group |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/expenses/add | Add expense |
| GET | /api/expenses/:groupId | Get group expenses |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |

### Balances
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/balances/:groupId | Get group balances & settlements |
| GET | /api/balances/user/summary | Get my overall balance |

---

## 🧪 Test with Postman

**Register:**
```
POST http://localhost:5000/api/auth/register
Body: { "name": "Alice", "email": "alice@test.com", "password": "123456" }
```

**Login:**
```
POST http://localhost:5000/api/auth/login
Body: { "email": "alice@test.com", "password": "123456" }
```

**Create Group (add token to Authorization: Bearer <token>):**
```
POST http://localhost:5000/api/groups/create
Body: { "name": "Goa Trip", "category": "trip", "members": [] }
```

---

##  Features

- ✅ JWT Authentication (login/register/protected routes)
- ✅ Create & manage groups
- ✅ Add expenses with equal or unequal split
- ✅ Smart debt simplification algorithm (minimize transactions)
- ✅ Real-time balance calculation
- ✅ Dark mode
- ✅ Transaction history with search & filter
- ✅ Responsive mobile-friendly UI
- ✅ Toast notifications
- ✅ Socket.io ready for real-time updates
- ✅ Animated Expenzo logo with glassmorphism UI
- ✅ Purple/indigo fintech color theme with micro-animations

---

##  Deploy

### Frontend → Vercel
1. Push code to GitHub
2. Go to vercel.com → Import project → Select `frontend` folder
3. Set build command: `npm run build`, output: `dist`

### Backend → Render
1. Go to render.com → New Web Service → Connect GitHub
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env`

### Database → MongoDB Atlas
1. Go to mongodb.com/atlas → Create free cluster
2. Get connection string → paste into `MONGO_URI` env var
