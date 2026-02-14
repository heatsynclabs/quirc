# Ergo IRC Server Deployment

QUIRC uses [Ergo](https://ergo.chat) (formerly Oragono) as its IRC server. Ergo supports WebSocket connections natively, making it ideal for web-based IRC clients.

## Docker Setup

The `Dockerfile` builds from the official Ergo image and copies in our custom `ircd.yaml`:

```bash
cd deploy
docker build -t quirc-ergo .
docker run -d -p 8080:8080 --name quirc-ergo quirc-ergo
```

The server listens on port **8080** for WebSocket connections.

### Persistent Storage

To persist user accounts and chat history across container restarts:

```bash
docker run -d -p 8080:8080 \
  -v quirc-data:/ircd \
  --name quirc-ergo quirc-ergo
```

## ircd.yaml Configuration

Key configuration sections:

### Server & Listeners

```yaml
server:
  name: irc.quirc.chat
  listeners:
    ":8080":
      websocket: true
  websocket-origins:
    - "https://quirc.chat"
    - "https://quirc.netlify.app"
```

- `websocket: true` enables WebSocket on that port
- `websocket-origins` restricts which web origins can connect (CORS)
- Add your domain to the origins list when self-hosting

### Accounts & Registration

```yaml
accounts:
  registration:
    enabled: true
    bcrypt-cost: 4
    throttling:
      enabled: true
      duration: 10m
      max-attempts: 30
    email-verification:
      enabled: false
  authentication-enabled: true
  multiclient:
    enabled: true
    allowed-by-default: true
```

- `bcrypt-cost: 4` — low cost for fast registration on small instances. Increase to 10+ for public servers
- `throttling` — limits registration attempts per IP to prevent abuse
- `email-verification` — disabled by default; enable and configure SMTP for production
- `multiclient` — allows the same account to connect from multiple devices

### History

```yaml
history:
  enabled: true
  channel-length: 10000
  client-length: 1000
  chathistory-maxmessages: 1000
  retention:
    cutoff: 168h
```

- `chathistory-maxmessages` — maximum messages returned per CHATHISTORY request
- `cutoff: 168h` — messages older than 7 days are purged

### Limits

```yaml
limits:
  nicklen: 32
  channellen: 64
  topiclen: 390
```

Adjust these based on your community's needs.

## DigitalOcean App Platform

The `app.yaml` spec deploys Ergo to DigitalOcean App Platform:

```bash
doctl apps create --spec deploy/app.yaml
```

### How It Works

1. App Platform builds the Docker image from `deploy/Dockerfile`
2. Runs the container with port 8080 exposed
3. App Platform terminates TLS — clients connect via `wss://irc.quirc.chat`
4. The health check runs on TCP port 8080 (not HTTP, since it's a WebSocket endpoint)

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

- **bcrypt cost** — `4` is minimal; use `10` or higher for public-facing servers
- **Rate limiting** — registration throttling prevents account creation spam
- **IP cloaking** — enabled by default, hides user IPs behind `quirc` cloaked hostnames
- **WebSocket origins** — restrict to your domain(s) to prevent unauthorized embedding
- **TLS** — always terminate TLS in front of Ergo (App Platform, nginx, Caddy, etc.)
- **Bouncer mode** — enabled by default; allows persistent connections across client reconnects

## Updating

To update Ergo:

1. Update the base image tag in `Dockerfile` (e.g., `ghcr.io/ergochat/ergo:v2.x.x`)
2. Check the [Ergo changelog](https://github.com/ergochat/ergo/releases) for breaking config changes
3. Rebuild and redeploy
