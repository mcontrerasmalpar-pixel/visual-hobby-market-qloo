"""
CLI Retro Y2K para Visual Hobby Finder (Hackathon Qloo)
Permite analizar una carpeta de imágenes (capturas, Pinterest) o pasar tags visuales
directamente desde la terminal y obtener recomendaciones de Qloo API.

Uso:
  python cli.py --tags "cyberpunk,brutalist architecture,lo-fi jazz"
  python cli.py --folder "./mis_capturas"
"""
import argparse
import asyncio
from pathlib import Path
from typing import List
from PIL import Image

from services.qloo import get_hobby_recommendations

BANNER = r"""
╔══════════════════════════════════════════════════════════════════════╗
║  ██╗   ██╗██╗███████╗██╗   ██╗ █████╗ ██╗         ██╗  ██╗██████╗   ║
║  ██║   ██║██║██╔════╝██║   ██║██╔══██╗██║         ██║  ██║╚════██╗  ║
║  ██║   ██║██║███████╗██║   ██║███████║██║         ███████║ █████╔╝  ║
║  ╚██╗ ██╔╝██║╚════██║██║   ██║██╔══██║██║         ██╔══██║██╔═══╝   ║
║   ╚████╔╝ ██║███████║╚██████╔╝██║  ██║███████╗    ██║  ██║███████╗  ║
║    ╚═══╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚══════╝  ║
║   [ VISUAL HOBBY FINDER CLI // POWERED BY QLOO TASTE AI™ ]           ║
╚══════════════════════════════════════════════════════════════════════╝
"""


def detect_aesthetics_from_image(img_path: Path) -> List[str]:
    """Extrae etiquetas semánticas analizando paleta de colores, contraste y nombre del archivo."""
    detected: List[str] = []
    name_lower = img_path.stem.lower()

    keyword_map = {
        "cyber": "cyberpunk",
        "neon": "cyberpunk",
        "brutal": "brutalist architecture",
        "concrete": "brutalist architecture",
        "arch": "brutalist architecture",
        "plant": "botanical",
        "green": "botanical",
        "leaf": "botanical",
        "jazz": "lo-fi jazz",
        "vinyl": "lo-fi jazz",
        "lofi": "lo-fi jazz",
        "y2k": "y2k retro",
        "retro": "y2k retro",
        "film": "analog photography",
        "book": "dark academia",
    }
    for kw, tag in keyword_map.items():
        if kw in name_lower and tag not in detected:
            detected.append(tag)

    try:
        with Image.open(img_path) as im:
            im = im.convert("RGB").resize((64, 64))
            pixels = list(im.getdata())
            r_avg = sum(p[0] for p in pixels) / len(pixels)
            g_avg = sum(p[1] for p in pixels) / len(pixels)
            b_avg = sum(p[2] for p in pixels) / len(pixels)
            brightness = (r_avg + g_avg + b_avg) / 3

            if g_avg > r_avg + 18 and g_avg > b_avg + 12:
                detected.append("botanical")
            elif b_avg > 130 and r_avg > 110:
                detected.append("cyberpunk")
            elif abs(r_avg - g_avg) < 12 and abs(g_avg - b_avg) < 12:
                detected.append("brutalist architecture")
            elif brightness < 85:
                detected.append("dark academia")
            else:
                detected.append("y2k retro")
    except Exception:
        pass

    return list(dict.fromkeys(detected)) or ["y2k retro"]


async def run_cli(tags: List[str], folder: str | None) -> None:
    print(BANNER)
    resolved_tags = list(tags)

    if folder:
        folder_path = Path(folder)
        if folder_path.exists() and folder_path.is_dir():
            images = [
                p for p in folder_path.iterdir()
                if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
            ]
            print(f"> ESCANEANDO CARPETA: {folder_path.resolve()} ({len(images)} imágenes encontradas)")
            for img in images[:6]:
                img_tags = detect_aesthetics_from_image(img)
                print(f"  [+] {img.name} -> {', '.join(img_tags).upper()}")
                resolved_tags.extend(img_tags)
        else:
            print(f"> [!] La carpeta '{folder}' no existe. Usando tags por defecto.")

    resolved_tags = list(dict.fromkeys([t.strip() for t in resolved_tags if t.strip()]))
    if not resolved_tags:
        resolved_tags = ["cyberpunk", "brutalist architecture", "lo-fi jazz"]

    result = await get_hobby_recommendations(resolved_tags)

    print("\n--- [ TERMINAL LOG ] ---")
    for line in result["terminal_logs"]:
        print(line)

    print(f"\n=== ARQUETIPO VISUAL: {result['aesthetic_dna']['archetype']} ===")
    print(result["aesthetic_dna"]["vibe_summary"])

    print("\n=== HOBBIES RECOMENDADOS POR TU ADN ESTÉTICO + QLOO ===")
    for idx, hobby in enumerate(result["hobbies"], start=1):
        print(f"\n[{idx}] {hobby['title']} ({hobby['match_score']}% MATCH | {hobby['difficulty']})")
        print(f"    Tag Origen : #{hobby['tag']} | Categoría: {hobby['category']}")
        print(f"    Descripción: {hobby['description']}")
        print(f"    Starter Kit: {', '.join(hobby['starter_kit'])}")
        matches = ", ".join(f"{m['name']} ({m['type']})" for m in hobby["cultural_matches"])
        print(f"    Qloo Taste : {matches}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Visual Hobby Finder CLI (Qloo Hackathon)")
    parser.add_argument(
        "--tags",
        type=str,
        default="cyberpunk,brutalist architecture,lo-fi jazz",
        help="Tags visuales separados por coma"
    )
    parser.add_argument(
        "--folder",
        type=str,
        default=None,
        help="Ruta opcional a carpeta con capturas de pantalla / Pinterest"
    )
    args = parser.parse_args()
    tag_list = [t.strip() for t in args.tags.split(",") if t.strip()]
    asyncio.run(run_cli(tag_list, args.folder))
