# syntax=docker/dockerfile:1
FROM varnish:7.6

LABEL maintainer="Josep Castells <josepcastellsbusiness@gmail.com>" \
      org.label-schema.name="estadesdelta-varnish" \
      org.label-schema.description="Estades Delta Varnish image." \
      org.label-schema.vendor="Josep Castells"

COPY etc/varnish.vcl /etc/varnish/default.vcl
