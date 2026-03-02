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
NGINX_CONF_DEST="/etc/nginx/sites-available/$DOMAIN"

# ── 1. Install certbot if not present ────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "### Installing certbot..."
  apt-get update -qq
  apt-get install -y certbot
fi

# ── 2. Create webroot directory for ACME challenge ────────────────────────────
echo "### Creating ACME challenge directory..."
mkdir -p /var/www/certbot

# ── 3. Deploy nginx config ────────────────────────────────────────────────────
echo "### Deploying nginx config for $DOMAIN..."
cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"

# Enable site
ln -sf "$NGINX_CONF_DEST" "/etc/nginx/sites-enabled/$DOMAIN"

# Test nginx config
nginx -t

# Reload nginx so it starts listening for the ACME challenge on port 80
echo "### Reloading nginx (HTTP only, no cert yet)..."
# Temporarily comment out the SSL block so nginx can start without the cert
sed -i 's/listen 443 ssl/listen 443 ssl_disabled/' "/etc/nginx/sites-enabled/$DOMAIN"
nginx -s reload

sleep 2

# ── 4. Obtain Let's Encrypt certificate ───────────────────────────────────────
echo "### Requesting certificate for $DOMAIN..."
certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --domain "$DOMAIN" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

# ── 5. Re-enable SSL block and reload ─────────────────────────────────────────
echo "### Enabling HTTPS in nginx config..."
sed -i 's/listen 443 ssl_disabled/listen 443 ssl/' "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t
nginx -s reload

# ── 6. Set up automatic renewal via cron ──────────────────────────────────────
echo "### Setting up auto-renewal cron job..."
CRON_JOB="0 3 * * * certbot renew --quiet --post-hook 'nginx -s reload'"
( crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB" ) | crontab -

echo ""
echo "Done! https://$DOMAIN should now be accessible with a valid certificate."
echo "Certificate will auto-renew every day at 03:00 (skipped if not due)."
