# Deploy FindOne with Vercel + Render + Atlas

This is the simplest free-friendly way to host the current project:

- `client/` on Vercel
- `server/` on Render
- MongoDB on Atlas

## 1. Push to GitHub

1. Create a GitHub repository.
2. Push this project to GitHub.

## 2. Create MongoDB Atlas database

1. Sign in to MongoDB Atlas.
2. Create a free cluster.
3. Create a database user.
4. Add a Network Access entry.
5. Copy the application connection string.

Use the connection string in this format:

```env
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster-url>/findone?retryWrites=true&w=majority
```

Notes:

- Atlas requires an IP access list entry before the app can connect.
- For a simple free setup with Render, many people use `0.0.0.0/0` for Atlas network access because Render free services do not provide a fixed outbound IP. This is the easiest setup, but it is less restrictive.

## 3. Deploy backend on Render

This repo includes [render.yaml](/x:/FindOne/render.yaml) for the backend service.

1. Go to Render.
2. Click `New` -> `Blueprint`.
3. Connect your GitHub repo.
4. Render will detect [render.yaml](/x:/FindOne/render.yaml).
5. Create the service.

Render service settings used by this project:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables in Render:

```env
CLIENT_URL=https://your-vercel-app.vercel.app
MONGODB_URI=your-atlas-connection-string
SERVER_URL=https://your-render-service.onrender.com
```

The rest are already defined in [render.yaml](/x:/FindOne/render.yaml).

After deploy, test:

```text
https://your-render-service.onrender.com/health
```

## 4. Seed the database

After Atlas and Render are ready, seed from your local machine:

```powershell
$env:MONGODB_URI="your-atlas-connection-string"
npm run seed:categories --prefix server
npm run seed:demo --prefix server
```

If you do not want demo users in production, run only:

```powershell
$env:MONGODB_URI="your-atlas-connection-string"
npm run seed:categories --prefix server
```

## 5. Deploy frontend on Vercel

This repo includes [client/vercel.json](/x:/FindOne/client/vercel.json) so React Router deep links work on Vercel.

1. Go to Vercel.
2. Import the same GitHub repository.
3. Set the root directory to `client`.
4. Let Vercel detect Vite.
5. Add this environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api/v1
```

6. Deploy.

After deploy, your frontend URL will look like:

```text
https://your-app.vercel.app
```

## 6. Connect frontend and backend

After Vercel gives you the frontend URL:

1. Go back to Render.
2. Update:

```env
CLIENT_URL=https://your-app.vercel.app
```

3. Redeploy the Render service.

This is required because the Express app uses `CLIENT_URL` for CORS.

## 7. Optional custom domains

You can later add:

- `www.yourdomain.com` on Vercel
- `api.yourdomain.com` on Render

If you do that, update:

```env
CLIENT_URL=https://www.yourdomain.com
SERVER_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

Then redeploy both services.

## 8. Important limitation in current codebase

Uploads are stored on the backend filesystem right now.

That means:

- uploaded images are not ideal on free hosting
- files may not persist reliably across deploys or restarts

For production, move uploads to a cloud storage service such as Cloudinary, S3, or Supabase Storage.

## 9. Final test checklist

1. Open frontend home page.
2. Register a new account.
3. Log in.
4. Open `/workers`.
5. Open `/jobs`.
6. Create a booking as a client.
7. Apply to a job as a worker.
8. Test dashboard pages.
9. Test messaging.
10. Test backend health endpoint.

## Official docs

- Vercel Vite deployment:
  https://vercel.com/docs/frameworks/frontend/vite
- Vercel project settings:
  https://vercel.com/docs/project-configuration/project-settings
- Render Node/Express deploy:
  https://render.com/docs/deploy-node-express-app
- Render free web services:
  https://render.com/docs/free
- Render custom domains:
  https://render.com/docs/custom-domains
- Render environment variables:
  https://render.com/docs/configure-environment-variables
- Render monorepo root directory:
  https://render.com/docs/monorepo-support
- Render blueprint reference:
  https://render.com/docs/blueprint-spec
- Atlas free cluster:
  https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- Atlas app connection:
  https://www.mongodb.com/docs/atlas/driver-connection/index.html
