#!/usr/bin/env bash
chown www-data:www-data /var/www/project
exec "$@"