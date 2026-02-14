# Self-Hosting QUIRC

This guide walks you through deploying your own QUIRC instance: the web client + Ergo IRC server.

## Prerequisites

- Node.js 18+
- Docker (for the IRC server)
- A domain name (optional but recommended)
- A static hosting provider (Netlify, Vercel, Cloudflare Pages, or any web server)

## Step 1: Fork & Clone

```bash
git clone https://github.com/virgilvox/quirc.git
cd quirc
npm install
```

## Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Your IRC server's hostname
VITE_DEFAULT_SERVER=irc.yourdomain.com

# Your IRC server's port
VITE_DEFAULT_PORT=6697

# WebSocket URL (what the client connects to)
VITE_GATEWAY_URL=wss://irc.yourdomain.com

# Channels to auto-join on connect
VITE_AUTO_JOIN=#general,#random
```

## Step 3: Deploy the IRC Server

### Option A: Docker (any VPS)

```bash
cd deploy
docker build -t quirc-ergo .
docker run -d -p 8080:8080 -v quirc-data:/ircd --name quirc-ergo quirc-ergo
```

You'll need a reverse proxy (nginx, Caddy) in front to handle TLS:

**nginx example:**

```nginx
server {
    listen 443 ssl;
    server_name irc.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

**Caddy example:**

```
irc.yourdomain.com {
    reverse_proxy localhost:8080
}
```

### Option B: DigitalOcean App Platform

```bash
doctl apps create --spec deploy/app.yaml
```

Edit `deploy/app.yaml` to update your domain and GitHub repo. See [deploy/README.md](../deploy/README.md) for details.

### Configure WebSocket Origins

Edit `deploy/ircd.yaml` and add your domain:

```yaml
server:
  websocket-origins:
    - "https://yourdomain.com"
```

Rebuild and restart the container after changing the config.

## Step 4: Deploy the Web Client

### Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard (all the `VITE_*` vars)

### Vercel

1. Import your GitHub repo
2. Framework preset: Vite
3. Add environment variables in project settings

### Any Static Host

```bash
npm run build
```

Upload the `dist/` folder to your web server. The app is fully static — no server-side rendering needed.

## Step 5: Configure DNS

Point your domains:

| Record | Name | Value |
|---|---|---|
| A or CNAME | `yourdomain.com` | Your static host |
| A or CNAME | `irc.yourdomain.com` | Your IRC server |

## Step 6: File Uploads (Optional)

QUIRC supports file uploads via S3-compatible storage (DigitalOcean Spaces, AWS S3, MinIO, etc.).

1. Create a Spaces bucket (or S3 bucket)
2. Enable CDN on the bucket
3. Set the server-side environment variables:

```bash
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=your-bucket
DO_SPACES_CDN_DOMAIN=your-bucket.sfo3.cdn.digitaloceanspaces.com
```

4. Set the client-side variables:

```bash
VITE_UPLOAD_API=/api/upload-url
VITE_CDN_DOMAIN=your-bucket.sfo3.cdn.digitaloceanspaces.com
```

The upload API runs as a Netlify Function. If you're not using Netlify, you'll need to implement a presigned URL endpoint yourself.

## Step 7: Customize Branding (Optional)

QUIRC's visual style is controlled by CSS custom properties in `src/assets/main.css`. You can override:

- Colors: `--q-accent-teal`, `--q-accent-orange`, etc.
- Backgrounds: `--q-bg-primary`, `--q-bg-secondary`
- Font: `--q-font-mono`

The splash screen logo is in `src/components/logo/`.

## Verification

After deploying:

1. Open your web client URL
2. You should see the connection modal with your server pre-filled
3. Connect as a guest — verify you join the auto-join channels
4. Register a nickname — verify the success flow completes
5. Disconnect and reconnect — verify SASL auto-login works
6. Send a DM — verify it appears in the DM section of the sidebar
7. Upload a file (if configured) — verify the CDN URL is posted
