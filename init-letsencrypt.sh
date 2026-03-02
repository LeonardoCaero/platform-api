#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# init-letsencrypt.sh
#
# Run this ONCE on first deploy on the NAS to:
#   1. Install certbot (if needed)
#   2. Deploy the nginx reverse proxy config for the domain
#   3. Obtain a Let's Encrypt certificate via HTTP-01 webroot challenge
#   4. Set up automatic renewal via cron
#
# Usage (on the NAS via SSH):
#   chmod +x init-letsencrypt.sh
#   sudo ./init-letsencrypt.sh
#
# Prerequisites:
#   - Ports 80 and 443 forwarded on your router to the NAS
#   - plataforma-lcl.ddns.net resolving to your public IP
#   - Docker containers running: docker compose up -d
# ─────────────────────────────────────────────────────────────────────────────

set -e

DOMAIN="plataforma-lcl.ddns.net"
EMAIL="leo.caero.ledezma@gmail.com"
NGINX_CONF_SRC="$(dirname "$0")/nas-nginx.conf"
NGINX_CONF_DEST="/etc/nginx/server.d/plataforma-lcl.ddns.net.conf"

# ── 1. Install certbot if not present ────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "### Installing certbot..."
  apt-get update -qq
  apt-get install -y certbot
fi

# ── 2. Create webroot directory for ACME challenge ────────────────────────────
echo "### Creating ACME challenge directory..."
mkdir -p /var/www/certbot

# ── 3. Obtain Let's Encrypt certificate (standalone — no nginx conflict) ──────
# Stop nginx so certbot can bind port 80 directly.
# This avoids conflicts with UGOS's built-in nginx redirect rules.
echo "### Stopping nginx temporarily to obtain certificate..."
systemctl stop nginx

echo "### Requesting certificate for $DOMAIN..."
certbot certonly \
  --standalone \
  --email "$EMAIL" \
  --domain "$DOMAIN" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

# ── 4. Deploy nginx config and restart ────────────────────────────────────────
echo "### Deploying nginx reverse proxy config for $DOMAIN..."
cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"

echo "### Starting nginx with SSL config..."
nginx -t
systemctl start nginx

# ── 5. Set up automatic renewal via cron ──────────────────────────────────────
echo "### Setting up auto-renewal cron job..."
CRON_JOB="0 3 * * * systemctl stop nginx && certbot renew --quiet --standalone && systemctl start nginx"
( crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB" ) | crontab -

echo ""
echo "Done! https://$DOMAIN should now be accessible with a valid certificate."
echo "Certificate will auto-renew every day at 03:00 (skipped if not due)."
