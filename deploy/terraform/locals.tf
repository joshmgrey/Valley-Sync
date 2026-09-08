locals {
  # Public host the app is served at.
  # - baked into the image at build time as NEXT_PUBLIC_APP_URL (client bundle
  #   + edge middleware CSRF check)
  # - used at runtime as AUTH_URL (Auth.js callback base) and for Socket.io CORS
  # - the ACM cert SAN and the Route53 record (dns.tf)
  fqdn    = "${var.subdomain}.${var.domain_name}"
  app_url = "https://${var.subdomain}.${var.domain_name}"
}
