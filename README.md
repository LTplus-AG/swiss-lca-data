# Swiss LCA Data

A web application providing access to environmental impact data for construction materials, sourced from KBOB (Koordinationskonferenz der Bau- und Liegenschaftsorgane der öffentlichen Bauherren).

## Features

- **Material Search**: Search and filter construction materials by various criteria
- **Data Explorer**: Interactive visualization of environmental impact data
- **BIM Integration**: Tools for integrating LCA data with BIM software
- **API Access**: RESTful API for programmatic access to the data

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for KV storage)
- Clerk account (for authentication)

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# API Configuration
API_SECRET_KEY=your_api_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000

# Vercel KV Storage
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Admin Access
NEXT_PUBLIC_ADMIN_USER_ID=your_admin_user_id
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/louistrue/swisslcadata.git
cd swisslcadata
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Documentation

For detailed API documentation, visit `/api-access` in the web application.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## Data Source

This application uses data from KBOB (Koordinationskonferenz der Bau- und Liegenschaftsorgane der öffentlichen Bauherren). The data is not created or verified by us. For more information, visit [KBOB: Ökobilanzdaten im Baubereich](https://www.kbob.admin.ch/de/oekobilanzdaten-im-baubereich).

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

## Deploy on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
