#!/usr/bin/env python3
"""
소셜미디어 스크립트 공통 모듈.

publish-social.py와 publish-substack.py에서 공유하는
상수, 초기화, 유틸리티 함수를 제공한다.
"""
import sys
import json
import re
from pathlib import Path

# Windows cp949 콘솔에서 UTF-8 출력 강제 (모듈 임포트 시 즉시 실행)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = open(sys.stdout.fileno(), mode="w", encoding="utf-8", buffering=1)
    sys.stderr = open(sys.stderr.fileno(), mode="w", encoding="utf-8", buffering=1)

# .env.local 자동 로드 (python-dotenv)
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).parent.parent / ".env.local"
    if _env_path.exists():
        load_dotenv(_env_path)
        print("[env] .env.local 로드됨")
except ImportError:
    pass  # dotenv 없어도 시스템 env로 동작


# ─── 공유 상수 ───────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).parent.parent
POSTS_DIR = REPO_ROOT / "posts"
INDEX_PATH = POSTS_DIR / "index.json"
PUBLISHABLE_TYPES = {"essays", "tech", "memos"}


# ─── 공유 유틸 ───────────────────────────────────────────────────────────────

def load_index() -> dict:
    """posts/index.json 로드."""
    with open(INDEX_PATH, encoding="utf-8") as f:
        return json.load(f)


def read_mdx_frontmatter(slug: str, content_type: str, locale: str) -> dict:
    """MDX 파일의 frontmatter를 파싱해 dict 반환."""
    mdx_path = POSTS_DIR / content_type / slug / f"{locale}.mdx"
    if not mdx_path.exists():
        return {}
    text = mdx_path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return {}
    result = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            key, _, val = line.partition(":")
            result[key.strip()] = val.strip().strip('"')
    return result


def get_publishable_candidates(posts: list) -> list:
    """PUBLISHABLE_TYPES에 해당하는 포스트만 필터링."""
    return [p for p in posts if p.get("content_type") in PUBLISHABLE_TYPES]


def find_post_by_slug(candidates: list, target_slug: str) -> "dict | None":
    """candidates 중 slug가 일치하는 포스트 반환. 없으면 None."""
    for p in candidates:
        if p["slug"] == target_slug:
            return p
    return None


def sort_by_published_at(posts: list) -> list:
    """published_at 내림차순 정렬한 새 리스트 반환."""
    return sorted(posts, key=lambda p: p.get("published_at", ""), reverse=True)
