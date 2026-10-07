#!/bin/sh
set -e

echo "[entrypoint] applying database migrations ..."
npx prisma migrate deploy

echo "[entrypoint] starting csmju-maintenance-request (ระบบแจ้งซ่อม)"
exec "$@"
