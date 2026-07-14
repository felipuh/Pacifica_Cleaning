#!/usr/bin/env bash
set -euo pipefail
umask 077

backup_dir="${BACKUP_DIR:-backups}"
db_service="${DB_SERVICE:-db}"
db_user="${POSTGRES_USER:-pacifica}"
db_name="${BACKUP_DATABASE:-${POSTGRES_DB:-pacifica}}"

mkdir -p "${backup_dir}"
timestamp="$(date +%Y%m%d_%H%M%S)"
output="${backup_dir}/pacifica_${timestamp}.sql.gz"

docker compose exec -T "${db_service}" pg_dump -U "${db_user}" "${db_name}" | gzip > "${output}"

if [[ -n "${BACKUP_PASSPHRASE:-}" ]]; then
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "${output}" -out "${output}.enc" -pass env:BACKUP_PASSPHRASE
  rm "${output}"
  echo "Encrypted backup created: ${output}.enc"
else
  echo "Backup created without encryption for local use: ${output}"
fi
