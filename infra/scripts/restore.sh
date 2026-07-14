#!/usr/bin/env bash
set -euo pipefail

backup_file="${1:?Provide backup file path}"
work_file="${backup_file}"
db_service="${DB_SERVICE:-db}"
db_user="${POSTGRES_USER:-pacifica}"
db_name="${RESTORE_DATABASE:-${POSTGRES_DB:-pacifica}}"

if [[ "${backup_file}" == *.enc ]]; then
  : "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required for encrypted backups}"
  work_file="$(mktemp /tmp/pacifica_restore.XXXXXX.sql.gz)"
  trap 'rm -f "${work_file}"' EXIT
  openssl enc -d -aes-256-cbc -pbkdf2 -in "${backup_file}" -out "${work_file}" -pass env:BACKUP_PASSPHRASE
fi

gunzip -c "${work_file}" | docker compose exec -T "${db_service}" psql -v ON_ERROR_STOP=1 -U "${db_user}" "${db_name}"
echo "Restore completed from ${backup_file}"
