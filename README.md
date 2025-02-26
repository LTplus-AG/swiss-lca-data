# Swiss LCA Data

A web application providing access to environmental impact data for construction materials, sourced from KBOB (Koordinationskonferenz der Bau- und Liegenschaftsorgane der öffentlichen Bauherren).

## Features

- **Material Search**: Search and filter construction materials by various criteria
- **Data Explorer**: Interactive visualization of environmental impact data
- **BIM Integration**: Tools for integrating LCA data with BIM software
- **API Access**: RESTful API for programmatic access to the data
- **Automated Data Updates**: Daily checks for new KBOB data versions with approval workflow

## Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for KV storage)
- Clerk account (for authentication)
- Slack workspace (for notifications and approval workflow)

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

# Slack Integration
SLACK_WEBHOOK_URL=your_slack_webhook_url

# API Keys for protected endpoints
API_KEYS=key1,key2,key3
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

## KBOB Data Ingestion

The application includes an automated system for keeping KBOB data up-to-date:

### Automated Daily Checks

- A daily cron job runs at 9:00 AM to check for new KBOB data versions
- It monitors the KBOB website for new Excel files
- When a new version is detected, a notification is sent to Slack

### Approval Workflow

- New data versions require manual approval before ingestion
- Slack notifications include a data preview and approval/rejection buttons
- Administrators can review the data before it's added to the database

### Version Management

- All ingested versions are tracked with metadata
- The system maintains a history of all versions
- API endpoints are available to view version history

### Manual Triggers

- Administrators can manually trigger version checks via API
- Protected endpoints require API key authentication

## Testing the Ingestion Flow

You can test the KBOB data ingestion flow without modifying the database in several ways:

### Using the Web Interface

1. Visit `/kbob-test` in your browser to access the test interface
2. In the Authentication section:
   - In development mode: Authentication is optional
   - In production mode: Enter your API key
3. Follow the step-by-step process:
   - Step 1: Click "Run Detection Test" to start the test flow
   - Step 2: After detection completes, you can simulate approval
   - Step 3: Alternatively, you can simulate rejection

### Using the API Endpoints

You can test the flow programmatically using these API endpoints:

1. `GET /api/kbob/test-flow?step=detect` - Run the detection step
2. `GET /api/kbob/test-flow?step=approve` - Simulate approval
3. `GET /api/kbob/test-flow?step=reject` - Simulate rejection

When calling these endpoints programmatically, include an Authorization header with your API key:

```
Authorization: Bearer your_api_key_here
```

In development mode, authentication is optional for testing purposes.

### Using the CLI Script

For command-line testing, use the provided script:

```bash
# Run the detection step
node scripts/test-kbob-flow.js detect

# Simulate approval
node scripts/test-kbob-flow.js approve

# Simulate rejection
node scripts/test-kbob-flow.js reject

# With API key (required in production)
node scripts/test-kbob-flow.js detect --api-key=your_api_key_here
```

This script provides a convenient way to test the full flow including Slack notifications without using the web interface.

### Using Slack Interactions

1. Run the detection step using any of the methods above
2. You'll receive a test notification in Slack with approval/rejection buttons
3. Click the buttons in Slack to simulate the approval/rejection process

### What Happens During Testing

The test flow:

1. Runs the actual scraper to find the latest KBOB data
2. Processes the Excel file to extract materials
3. Sends real notifications to Slack with test indicators
4. Simulates the approval/rejection process
5. Does NOT modify the actual database or ingest any data

All test data is stored separately from production data using a different key in the KV store, and all Slack messages are clearly marked as tests.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

## Deploy on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Slack Integration

The application uses Slack for notifications and interactive approval workflows. To set up Slack integration:

1. Create a Slack app in your workspace at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable Incoming Webhooks and create a webhook URL
3. Add the webhook URL to your `.env.local` file as `SLACK_WEBHOOK_URL`
4. Enable Interactivity for your Slack app (required for approval buttons)
5. Set the Interactivity Request URL to `https://your-domain.com/api/slack/interactive`

For detailed setup instructions, see [docs/slack-setup.md](docs/slack-setup.md).
