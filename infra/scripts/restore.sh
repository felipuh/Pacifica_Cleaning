#!/usr/bin/env bash
set -euo pipefail

backup_file="${1:?Provide backup file path}"
work_file="${backup_file}"

if [[ "${backup_file}" == *.enc ]]; then
  : "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required for encrypted backups}"
  work_file="/tmp/pacifica_restore.sql.gz"
  openssl enc -d -aes-256-cbc -pbkdf2 -in "${backup_file}" -out "${work_file}" -pass env:BACKUP_PASSPHRASE
fi

gunzip -c "${work_file}" | docker compose exec -T db psql -U pacifica pacifica
echo "Restore completed from ${backup_file}"
