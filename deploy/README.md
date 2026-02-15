# Ergo IRC Server Deployment

QUIRC uses [Ergo](https://ergo.chat) (formerly Oragono) as its IRC server. Ergo supports WebSocket connections natively, making it ideal for web-based IRC clients.

## Docker Setup

The `Dockerfile` builds from the official Ergo image, adds the [MinIO client](https://min.io/docs/minio/linux/reference/minio-mc.html) (`mc`) for S3-compatible database backups, and uses a custom `entrypoint.sh` that handles backup/restore lifecycle.

```bash
cd deploy
docker build -t quirc-ergo .
docker run -d -p 8080:8080 -v quirc-data:/ircd --name quirc-ergo quirc-ergo
```

The server listens on port **8080** for WebSocket connections.

### Database Persistence (DO Spaces Backup)

The `entrypoint.sh` script automatically backs up `ircd.db` to S3-compatible storage (DigitalOcean Spaces). This is critical on platforms like DO App Platform where the container filesystem is ephemeral.

**How it works:**
1. **On startup:** restores `ircd.db` from Spaces (if a backup exists)
2. **Every 5 minutes:** uploads a backup (interval configurable via `BACKUP_INTERVAL`)
3. **On shutdown (SIGTERM):** waits for Ergo to flush, then uploads a final backup

Pass Spaces credentials as environment variables:

```bash
docker run -d -p 8080:8080 -v quirc-data:/ircd \
  -e DO_SPACES_KEY=your-key \
  -e DO_SPACES_SECRET=your-secret \
  -e DO_SPACES_REGION=sfo3 \
  -e DO_SPACES_BUCKET=your-bucket \
  -e BACKUP_INTERVAL=300 \
  --name quirc-ergo quirc-ergo
```

If no Spaces credentials are set, the entrypoint skips backup/restore and runs Ergo normally.

## ircd.yaml Configuration

Key configuration sections:

### Server & WebSocket Origins

```yaml
server:
  name: irc.quirc.chat
  listeners:
    ":8080":
      websocket: true
  websockets:
    allowed-origins:
      - "https://quirc.chat"
      - "https://quirc.netlify.app"
      - "http://localhost:*"
```

- `websocket: true` enables WebSocket on that port
- `websockets.allowed-origins` restricts which web origins can connect (CORS)
- Add your domain to the origins list when self-hosting, or use `"*"` to allow all

### Accounts & Registration

```yaml
accounts:
  registration:
    enabled: true
    bcrypt-cost: 10
    throttling:
      enabled: true
      duration: 10m
      max-attempts: 5
    email-verification:
      enabled: false
  authentication-enabled: true
  multiclient:
    enabled: true
    allowed-by-default: true
    always-on: opt-in
    auto-away: opt-in
```

- `bcrypt-cost: 10` — standard cost for production password hashing
- `throttling` — limits registration to 5 attempts per IP per 10 minutes
- `email-verification` — disabled by default; enable and configure SMTP for production
- `multiclient` — allows the same account to connect from multiple devices

### Channels

```yaml
channels:
  default-modes: "+nt"
  max-channels-per-client: 100
  operator-only-creation: false
  registration:
    enabled: true
    operator-only: false
    max-channels-per-account: 15
```

- Channels are auto-created when the first user JOINs
- `operator-only-creation: false` — anyone can create channels
- Registered users can own channels via ChanServ

### History

```yaml
history:
  enabled: true
  channel-length: 10000
  client-length: 1000
  chathistory-maxmessages: 1000
  znc-maxmessages: 2048
  restrictions:
    expire-time: 168h
    query-cutoff: none
    grace-period: 1h
  retention:
    allow-individual-delete: false
  persistent:
    enabled: true
    unregistered-channels: false
    registered-channels: "opt-out"
    direct-messages: "opt-out"
```

- `chathistory-maxmessages` — maximum messages returned per CHATHISTORY request
- `expire-time: 168h` — messages older than 7 days are purged
- `persistent.enabled: true` — history is written to disk (survives restarts)
- `registered-channels: "opt-out"` — registered channels get persistent history by default

### Server Operators

Uncomment the `opers` section in `ircd.yaml` and set a bcrypt-hashed password:

```bash
# Generate a password hash inside the container
docker exec quirc-ergo /ircd-bin/ergo genpasswd
```

## DigitalOcean App Platform

The `app.yaml` spec deploys Ergo to DigitalOcean App Platform:

```bash
doctl apps create --spec deploy/app.yaml
```

**Important:** After deploying, set `DO_SPACES_KEY` and `DO_SPACES_SECRET` in the App Platform dashboard (Apps → Settings → Components → ergo → Environment Variables). These enable database backup so registered accounts, channels, and history survive redeployments.

### How It Works

1. App Platform builds the Docker image from `deploy/Dockerfile`
2. `entrypoint.sh` restores the database from Spaces (if a backup exists)
3. Ergo runs with port 8080 exposed; App Platform terminates TLS
4. Database is backed up to Spaces every 5 minutes and on graceful shutdown
5. Clients connect via `wss://irc.quirc.chat`

### Custom Domain

In `app.yaml`:

```yaml
domains:
  - domain: irc.quirc.chat
    type: PRIMARY
```

After deploying, add a CNAME record pointing your domain to the App Platform URL shown in the dashboard.

### Health Check

```yaml
health_check:
  port: 8080
  initial_delay_seconds: 10
  period_seconds: 30
  timeout_seconds: 5
  failure_threshold: 5
```

**Important:** This uses TCP health checks, not HTTP. Ergo's WebSocket listener doesn't respond to regular HTTP GET requests. App Platform's TCP check verifies the port is accepting connections.

## Security Considerations

- **bcrypt cost** — set to `10` for production; increase for higher security requirements
- **Rate limiting** — registration throttled to 5 attempts per 10 minutes per IP
- **IP cloaking** — enabled by default, hides user IPs behind `quirc` cloaked hostnames
- **WebSocket origins** — restrict to your domain(s) to prevent unauthorized embedding
- **TLS** — always terminate TLS in front of Ergo (App Platform, nginx, Caddy, etc.)
- **Multiclient** — enabled by default; allows persistent connections across client reconnects

## Updating

To update Ergo:

1. Update the base image tag in `Dockerfile` (e.g., `ghcr.io/ergochat/ergo:v2.x.x`)
2. Check the [Ergo changelog](https://github.com/ergochat/ergo/releases) for breaking config changes
3. Rebuild and redeploy
