#!/usr/bin/env bash
set -euo pipefail

mkdir -p backups
timestamp="$(date +%Y%m%d_%H%M%S)"
output="backups/pacifica_${timestamp}.sql.gz"

docker compose exec -T db pg_dump -U pacifica pacifica | gzip > "${output}"

if [[ -n "${BACKUP_PASSPHRASE:-}" ]]; then
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "${output}" -out "${output}.enc" -pass env:BACKUP_PASSPHRASE
  rm "${output}"
  echo "Encrypted backup created: ${output}.enc"
else
  echo "Backup created without encryption for local use: ${output}"
fi
