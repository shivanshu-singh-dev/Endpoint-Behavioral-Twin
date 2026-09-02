#!/bin/bash
# setup_db.sh - Idempotent database setup script for EBT
set -e

echo "Setting up MySQL databases for Endpoint Behavioral Twin..."

if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL client not found. Please install mysql-server and mysql-client."
    exit 1
fi

read -p "Enter MySQL root password (leave blank if passwordless): " root_pw
AUTH=""
if [ ! -z "$root_pw" ]; then
    AUTH="-p$root_pw"
fi

echo "Creating databases and user..."
mysql -u root $AUTH <<EOF
CREATE DATABASE IF NOT EXISTS ebt;
CREATE DATABASE IF NOT EXISTS ebt_ui;
CREATE USER IF NOT EXISTS 'ebt'@'localhost' IDENTIFIED BY 'ebt';
GRANT ALL PRIVILEGES ON ebt.* TO 'ebt'@'localhost';
GRANT ALL PRIVILEGES ON ebt_ui.* TO 'ebt'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "Importing schemas..."
cd ..
mysql -u root $AUTH ebt < schema.sql
mysql -u root $AUTH ebt_ui < ui/schema_ui.sql

echo "Database setup complete!"
echo "Core DB: ebt | UI DB: ebt_ui | User: ebt | Password: ebt"
