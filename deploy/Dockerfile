FROM ghcr.io/ergochat/ergo:stable

# Start from the default config bundled in the image, then apply our overrides
# The entrypoint generates /ircd/ircd.yaml from default.yaml on first run if missing,
# so we provide a complete config instead.
COPY ircd.yaml /ircd/ircd.yaml

EXPOSE 8080
