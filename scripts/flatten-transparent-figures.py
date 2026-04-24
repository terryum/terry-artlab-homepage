#!/usr/bin/env python3
"""
이미지의 투명 배경(RGBA/LA/palette+tRNS)을 흰색 배경으로 합성한다.
다크모드 사이트에서 투명 영역이 검정으로 비치는 문제를 막는다.

사용법:
    python scripts/flatten-transparent-figures.py <dir>      # 디렉토리 내 모든 이미지
    python scripts/flatten-transparent-figures.py <file.png> # 단일 파일
    python scripts/flatten-transparent-figures.py <dir> --quiet  # skip 로그 생략

처리 대상:
    - .png, .webp, .jpeg, .jpg
    - 디렉토리 모드에서는 fig-*, cover*, thumb*, og* 모두 검사 (포스트 자산 전부)
    - JPEG는 alpha가 없으므로 검사만 하고 스킵

변환 조건:
    - mode == "RGBA" 또는 "LA"
    - mode == "P" 이고 palette transparency(`tRNS`) 보유
    - 위 모드 + 실제 alpha < 255 픽셀이 1개 이상

특징:
    - 원본 in-place 덮어쓰기 (.bak 백업은 만들지 않음 — 호출자가 책임)
    - WebP는 quality=95, method=6 / PNG는 optimize=True / JPEG는 변경 없음
    - 종료 코드: 변환된 파일 수와 무관하게 0 (스킬 파이프라인을 막지 않음)
"""
import sys
from pathlib import Path
from PIL import Image


# 디렉토리 모드에서 검사할 파일 패턴 (출현 순서대로 처리)
DIR_PATTERNS = ("fig-*.png", "fig-*.webp", "cover*.png", "cover*.webp",
                "thumb*.png", "thumb*.webp", "og*.png", "og*.webp")
SUPPORTED_EXTS = (".png", ".webp", ".jpeg", ".jpg")


def has_real_transparency(img: Image.Image) -> bool:
    """alpha 채널 또는 palette transparency가 실제로 사용되는지 검사."""
    if img.mode in ("RGBA", "LA"):
        alpha = img.split()[-1]
        return alpha.getextrema()[0] < 255
    if img.mode == "P" and "transparency" in img.info:
        rgba = img.convert("RGBA")
        return rgba.split()[-1].getextrema()[0] < 255
    if img.mode == "RGBA" or img.info.get("transparency") is not None:
        rgba = img.convert("RGBA")
        return rgba.split()[-1].getextrema()[0] < 255
    return False


def flatten_to_white(img: Image.Image) -> Image.Image:
    """RGBA/LA/팔레트+tRNS 어떤 형태든 흰색 위에 합성한 RGB 반환."""
    rgba = img.convert("RGBA")
    white = Image.new("RGB", rgba.size, (255, 255, 255))
    white.paste(rgba, mask=rgba.split()[-1])
    return white


def save_in_place(img: Image.Image, path: Path) -> None:
    ext = path.suffix.lower()
    if ext == ".webp":
        img.save(path, "WEBP", quality=95, method=6)
    elif ext == ".png":
        img.save(path, "PNG", optimize=True)
    elif ext in (".jpg", ".jpeg"):
        img.save(path, "JPEG", quality=92, optimize=True)
    else:
        img.save(path)


def process_file(path: Path, quiet: bool = False) -> bool:
    """단일 파일 처리. 변환 발생 시 True."""
    if path.suffix.lower() not in SUPPORTED_EXTS:
        return False
    try:
        with Image.open(path) as img:
            img.load()
            if not has_real_transparency(img):
                if not quiet:
                    print(f"  [skip] {path.name} - no transparent pixels")
                return False
            original_mode = img.mode
            original_size = img.size
            result = flatten_to_white(img)
        save_in_place(result, path)
        print(f"  [ok]   {path.name} {original_size} {original_mode} -> RGB (white bg)")
        return True
    except Exception as e:
        print(f"  [err]  {path.name}: {e}")
        return False


def collect_paths(target: Path) -> list[Path]:
    if target.is_file():
        return [target]
    seen: set[Path] = set()
    paths: list[Path] = []
    for pattern in DIR_PATTERNS:
        for p in sorted(target.glob(pattern)):
            if p not in seen:
                seen.add(p)
                paths.append(p)
    # 그 외 png/webp도 함께 처리 (paper PDF 추출본, 임시 자산 등)
    for ext in ("*.png", "*.webp"):
        for p in sorted(target.glob(ext)):
            if p not in seen and not p.name.endswith(".bak"):
                seen.add(p)
                paths.append(p)
    return paths


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    quiet = "--quiet" in sys.argv[1:]
    if not args:
        print("Usage: python scripts/flatten-transparent-figures.py <dir_or_file> [--quiet]")
        return 1

    target = Path(args[0])
    if not target.exists():
        print(f"[ERROR] 경로를 찾을 수 없음: {target}")
        return 1

    paths = collect_paths(target)
    if not paths:
        print(f"[skip] no png/webp/jpeg files under {target}")
        return 0

    converted = 0
    for p in paths:
        if process_file(p, quiet=quiet):
            converted += 1
    print(f"\nDone: {converted}/{len(paths)} files flattened to white background")
    return 0


if __name__ == "__main__":
    sys.exit(main())
