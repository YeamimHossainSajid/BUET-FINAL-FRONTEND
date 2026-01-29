# E-Commerce Dashboard

Modern Next.js 15 e-commerce dashboard with real-time updates, inventory management, and analytics.

## Features

- Authentication with JWT token management
- Dashboard with analytics cards and real-time metrics
- Orders management with pagination and filtering
- Inventory management with SKU search and bulk updates
- Analytics dashboard with interactive charts
- Dark/light mode toggle
- WebSocket support for real-time updates
- Offline detection and queued actions
- Keyboard shortcuts
- Export functionality
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

If you encounter peer dependency issues, use:
```bash
npm install --legacy-peer-deps
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file (optional):

```env
# WebSocket URL for real-time updates (optional)
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws

# Enable mock WebSocket polling (for demo without backend)
NEXT_PUBLIC_WS_MOCK=true

# API base URL (defaults to same origin)
NEXT_PUBLIC_API_URL=https://your-api.com
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard routes (protected)
│   ├── api/               # API routes (mock data)
│   ├── login/             # Authentication page
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── layout/            # Layout components (sidebar, header, footer)
│   └── ui/                # Shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API client
├── stores/                # Zustand state management
└── types/                 # TypeScript types
```

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI component library
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Recharts** - Chart library
- **WebSockets** - Real-time updates

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - Go to Dashboard
- `Cmd/Ctrl + O` - Go to Orders
- `Cmd/Ctrl + I` - Go to Inventory
- `Cmd/Ctrl + A` - Go to Analytics
- `Cmd/Ctrl + /` - Focus search

## API Endpoints

The app includes mock API routes for development:

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/dashboard` - Dashboard summary
- `GET /api/orders` - List orders (with pagination/filtering)
- `POST /api/orders` - Create order
- `GET /api/inventory` - List inventory (with SKU search)
- `PATCH /api/inventory` - Update inventory
- `GET /api/analytics` - Analytics data
- `GET /api/health` - Health check

## Building for Production


```bash
npm run build
npm start
```

## License

MIT
