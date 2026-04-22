#!/usr/bin/env bash

###############################################################################
# Vite 前端静态站部署脚本
# -----------------------------------------------------------------------------
# 1. 拉取当前前端仓库最新代码
# 2. 安装/更新依赖
# 3. 构建 dist
# 4. 为静态资源生成 .gz 预压缩文件，配合 Nginx gzip_static 使用
#
# 用法：
#   ./scripts/deploy.sh            # 默认执行 update + install + build
#   ./scripts/deploy.sh install    # 仅安装依赖
#   ./scripts/deploy.sh build      # 安装依赖并构建
#   ./scripts/deploy.sh update     # 仅拉最新代码
###############################################################################

set -euo pipefail

COMMAND="${1:-deploy}"  # deploy | install | build | update
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"

log()   { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

die() {
  error "$*"
  exit 1
}

check_prerequisites() {
  command -v node >/dev/null 2>&1 || die "未检测到 node，请先安装 Node.js 18+"
  command -v npm >/dev/null 2>&1 || die "未检测到 npm，请先安装 Node.js 18+"
}

update_repo() {
  if [[ -d "$PROJECT_ROOT/.git" ]]; then
    log "拉取最新代码 ($PROJECT_ROOT)..."
    git -C "$PROJECT_ROOT" fetch --all --prune
    git -C "$PROJECT_ROOT" pull --ff-only
  else
    warn "$PROJECT_ROOT 不是 Git 仓库，跳过拉取"
  fi
}

install_dependencies() {
  log "安装前端依赖..."
  pushd "$PROJECT_ROOT" >/dev/null
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  popd >/dev/null
}

gzip_dist_assets() {
  if [[ ! -d "$DIST_DIR" ]]; then
    die "前端构建失败，未找到 $DIST_DIR"
  fi
  log "生成预压缩 .gz 文件..."
  find "$DIST_DIR" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) -exec gzip -9 -k -f {} \;
  log "预压缩完成，共 $(find "$DIST_DIR" -name "*.gz" | wc -l | tr -d ' ') 个文件"
}

build_frontend() {
  log "构建前端项目..."
  pushd "$PROJECT_ROOT" >/dev/null
  npm run build
  popd >/dev/null
  gzip_dist_assets
  log "前端构建完成，输出目录 $DIST_DIR"
}

case "$COMMAND" in
  update)
    check_prerequisites
    update_repo
    ;;
  install)
    check_prerequisites
    install_dependencies
    ;;
  build)
    check_prerequisites
    install_dependencies
    build_frontend
    ;;
  deploy|*)
    check_prerequisites
    update_repo
    install_dependencies
    build_frontend
    ;;
esac

log "部署流程完成"
