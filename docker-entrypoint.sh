#!/bin/sh
# Runs on every container start, before the app boots. Applying migrations
# automatically here is a reasonable choice for a single-instance
# docker-compose setup like this one — in a real multi-replica production
# deployment you'd usually run migrations as a separate one-off CI/CD step
# instead, so N containers starting at once can't race each other running
# the same migration.
set -e

echo "Running database migrations..."
npm run migration:run:prod

echo "Starting server..."
exec "$@"
