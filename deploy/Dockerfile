FROM ghcr.io/ergochat/ergo:stable

USER root

# MinIO client for S3-compatible backups to DO Spaces
ADD https://dl.min.io/client/mc/release/linux-amd64/mc /usr/local/bin/mc
RUN chmod +x /usr/local/bin/mc

# Ensure ergo user exists (some base image versions may not create it)
RUN id ergo 2>/dev/null || adduser -D ergo

COPY ircd.yaml /ircd/ircd.yaml
COPY entrypoint.sh /ircd/entrypoint.sh
RUN chmod +x /ircd/entrypoint.sh \
 && chown -R ergo:ergo /ircd

USER ergo

EXPOSE 8080

ENTRYPOINT ["/ircd/entrypoint.sh"]
