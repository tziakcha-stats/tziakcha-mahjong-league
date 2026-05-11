#!/usr/bin/env bash
set -Eeuo pipefail

print_usage() {
  cat <<'USAGE'
Usage:
  npm run deploy
  DEPLOY_CONFIRM=1 npm run deploy

Optional:
  DEPLOY_HOST=root@8.146.201.177
  DEPLOY_BASE=/var/www/web
  DEPLOY_APP=sduleague
  DEPLOY_RSYNC_FLAGS="-az --delete --progress --stats"
  DEPLOY_RELEASE=20260511120000
  DEPLOY_SKIP_BUILD=1
  DEPLOY_QUIET=1

Default deploy target:
  root@8.146.201.177:/var/www/web/sduleague.release-<timestamp>

After upload, confirmed deploys switch:
  /var/www/web/sduleague -> /var/www/web/sduleague.release-<timestamp>

By default this script runs rsync in dry-run mode and does not switch the remote
symlink. Set DEPLOY_CONFIRM=1 to deploy for real.

Legacy/custom target mode:
  DEPLOY_TARGET=user@host:/remote/path DEPLOY_CONFIRM=1 npm run deploy
USAGE
}

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
deploy_host="${DEPLOY_HOST:-root@8.146.201.177}"
deploy_base="${DEPLOY_BASE:-/var/www/web}"
deploy_app="${DEPLOY_APP:-sduleague}"
deploy_release="${DEPLOY_RELEASE:-$(date +%Y%m%d%H%M%S)}"
deploy_target="${DEPLOY_TARGET:-$deploy_host:$deploy_base/$deploy_app.release-$deploy_release}"
remote_release_path="$deploy_base/$deploy_app.release-$deploy_release"
remote_current_path="$deploy_base/$deploy_app"
rsync_flags="${DEPLOY_RSYNC_FLAGS:--az --delete --progress --stats}"

if [[ "${DEPLOY_QUIET:-0}" == "1" && -z "${DEPLOY_RSYNC_FLAGS:-}" ]]; then
  rsync_flags="-az --delete --stats"
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but was not found in PATH." >&2
  exit 127
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh is required but was not found in PATH." >&2
  exit 127
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required but was not found in PATH." >&2
  exit 127
fi

cd "$project_root"

if [[ "${DEPLOY_SKIP_BUILD:-0}" != "1" ]]; then
  npm run build
fi

if [[ ! -d out ]]; then
  echo "Build output directory not found: $project_root/out" >&2
  exit 1
fi

if [[ ! -f out/index.html ]]; then
  echo "Build output is missing out/index.html; refusing to deploy." >&2
  exit 1
fi

if [[ "${DEPLOY_CONFIRM:-0}" == "1" ]]; then
  echo "Deploying out/ to $deploy_target"
  # shellcheck disable=SC2086
  rsync $rsync_flags out/ "$deploy_target/"

  if [[ -z "${DEPLOY_TARGET:-}" ]]; then
    echo "Switching $remote_current_path -> $remote_release_path"
    ssh "$deploy_host" "ln -sfn '$remote_release_path' '$remote_current_path'"

    echo "Verifying deployment"
    ssh "$deploy_host" "test -f '$remote_current_path/index.html' && test -f '$remote_current_path/brand-icon.png'"
    curl -fsSI "https://web.choimoe.com/$deploy_app/" >/dev/null
    curl -fsSI "https://web.choimoe.com/$deploy_app/brand-icon.png" >/dev/null
    echo "Deployment verified: https://web.choimoe.com/$deploy_app/"
  fi
else
  echo "Dry run: out/ -> $deploy_target"
  echo "Set DEPLOY_CONFIRM=1 to deploy for real."
  # shellcheck disable=SC2086
  rsync --dry-run $rsync_flags out/ "$deploy_target/"

  if [[ -z "${DEPLOY_TARGET:-}" ]]; then
    echo "Dry run only: would switch $remote_current_path -> $remote_release_path"
  fi
fi
