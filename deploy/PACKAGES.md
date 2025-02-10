# Package Structure Guide

## Workspace Packages

The dashboard depends on several internal workspace packages:

### Core Packages
- `@midday/supabase`: Supabase client and database interactions
- `@midday/ui`: Shared UI components
- `@midday/utils`: Common utility functions
- `@midday/events`: Event handling and tracking

### Feature Packages
- `@midday/app-store`: App store functionality
- `@midday/inbox`: Inbox management
- `@midday/invoice`: Invoice handling
- `@midday/kv`: Key-value storage
- `@midday/location`: Location services
- `@midday/notification`: Notification system

## Building Packages

The packages are built using Turborepo, which handles the build order and dependencies automatically. The command:
```bash
bun run build --filter=@midday/dashboard...
```
will build the dashboard and all its dependencies in the correct order.

## Package Dependencies

Each package has its own dependencies defined in its package.json. Key external dependencies include:

### UI and Components
- @hookform/resolvers
- @tanstack/react-table
- framer-motion
- @uidotdev/usehooks

### Data and State Management
- @supabase/sentry-js-integration
- @trigger.dev/sdk
- @upstash/ratelimit

### Date and Time
- @date-fns/tz
- date-fns

### Maps and Location
- @react-google-maps/api

### Development and Monitoring
- @sentry/nextjs
- @trigger.dev/react-hooks

## Environment Variables

Each package might require specific environment variables. Make sure these are set in your deployment:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Other Services
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
TRIGGER_API_KEY=your_trigger_key
SENTRY_DSN=your_sentry_dsn
```

## Development vs Production

In development:
- All packages are symlinked using workspace references
- Changes to packages are immediately reflected
- Full source code is available

In production:
- Packages are built and optimized
- Only necessary files are included
- Source maps are generated for debugging

## Updating Packages

When deploying updates:
1. All workspace packages are built first
2. The dashboard is built using the built packages
3. Only the necessary built files are included in the final image

## Troubleshooting

If you encounter package-related issues:

1. Clear build caches:
```bash
bun run clean
bun run clean:workspaces
```

2. Rebuild all packages:
```bash
bun install
bun run build
```

3. Check package versions:
```bash
bun run manypkg check
```
