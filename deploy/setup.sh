#!/bin/bash
# deploy/setup.sh — Bootstrap a fresh Ubuntu 24.04 Droplet
set -e

# --- System ---
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx ufw

# --- Firewall ---
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 6697/tcp
ufw --force enable

# --- Ergo IRC Server ---
ERGO_VERSION="2.14.0"
wget "https://github.com/ergochat/ergo/releases/download/v${ERGO_VERSION}/ergo-${ERGO_VERSION}-linux-x64.tar.gz"
tar xzf "ergo-${ERGO_VERSION}-linux-x64.tar.gz"
mv ergo-${ERGO_VERSION}-linux-x64 /opt/ergo
cp /opt/ergo/default.yaml /opt/ergo/ircd.yaml

useradd --system --home /opt/ergo --shell /usr/sbin/nologin ergo
chown -R ergo:ergo /opt/ergo

cat > /etc/systemd/system/ergo.service << 'EOF'
[Unit]
Description=Ergo IRC Server
After=network.target

[Service]
Type=simple
User=ergo
WorkingDirectory=/opt/ergo
ExecStart=/opt/ergo/ergo run --conf /opt/ergo/ircd.yaml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ergo

echo "Done. Edit /opt/ergo/ircd.yaml, then: systemctl start ergo"
