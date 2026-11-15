import sys
from pathlib import Path
from PIL import Image

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[2]
UPLOADS = ROOT / 'uploads'
MAX_WIDTH = 1600
QUALITY = 82
SKIP_SUFFIX = ('_backup',)


def convert(src: Path):
    """转成 webp；只有确实更小才保留并返回新路径。"""
    if src.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.heif', '.heic'):
        return None
    if any(tag in src.stem for tag in SKIP_SUFFIX):
        return None

    dst = src.with_suffix('.webp')
    try:
        im = Image.open(src)
    except Exception as e:
        print(f'skip {src.name}: {e}')
        return None

    if getattr(im, 'n_frames', 1) > 1:
        print(f'skip {src.name}: animated')
        return None

    has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    im = im.convert('RGBA' if has_alpha else 'RGB')
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)

    im.save(dst, 'WEBP', quality=QUALITY, method=6, optimize=True)
    if dst.stat().st_size >= src.stat().st_size:
        dst.unlink()
        print(f'skip {src.name}: webp not smaller')
        return None
    print(f'converted {src.name} -> {dst.name} ({src.stat().st_size // 1024}KB -> {dst.stat().st_size // 1024}KB)')
    return dst


def rewrite_refs(old_rel: str, new_rel: str):
    for pattern in ('data/*.json', '*.html'):
        for f in ROOT.glob(pattern):
            try:
                s = f.read_text(encoding='utf-8')
            except Exception:
                continue
            if old_rel in s:
                f.write_text(s.replace(old_rel, new_rel), encoding='utf-8')
                print(f'ref updated: {f.name}')


def load_corpus() -> str:
    parts = []
    for pattern in ('data/*.json', '*.html'):
        for f in ROOT.glob(pattern):
            try:
                parts.append(f.read_text(encoding='utf-8'))
            except Exception:
                continue
    return '\n'.join(parts)


def main():
    if not UPLOADS.is_dir():
        print('no uploads dir')
        return

    corpus = load_corpus()
    changed = 0
    for src in sorted(UPLOADS.rglob('*')):
        if not src.is_file():
            continue
        rel = src.relative_to(ROOT).as_posix()
        # 只处理被页面/数据引用到的图片，避免为无用的历史文件生成副本
        if rel not in corpus:
            print(f'skip {rel}: not referenced')
            continue
        if src.stat().st_size > 20 * 1024 * 1024:
            print(f'skip {rel}: too large')
            continue
        dst = convert(src)
        if not dst:
            continue
        rewrite_refs(rel, dst.relative_to(ROOT).as_posix())
        changed += 1

    print(f'done, {changed} converted')
    if changed == 0:
        sys.exit(0)


if __name__ == '__main__':
    main()
