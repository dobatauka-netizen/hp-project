"""
弥生会計スマート取込 自動化システム
メインエントリーポイント

使い方:
  python main.py                     # input/ フォルダ内の全ファイルを処理
  python main.py path/to/file.csv    # 指定ファイルを処理
"""
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

from src.cleaner import DataCleaner
from src.classifier import AccountClassifier
from src.formatter import YayoiFormatter
from src.loader import OcrLoader


def setup_logging(log_dir: str) -> None:
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    log_file = Path(log_dir) / f"yayoi_import_{datetime.now():%Y%m%d_%H%M%S}.log"

    stream_handler = logging.StreamHandler(sys.stdout)
    # Windowsコンソールのcp932文字化け対策
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            stream_handler,
        ],
    )
    logging.info(f"ログ出力先: {log_file}")


def load_settings(path: str = "config/settings.json") -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def process_file(file_path: str, settings: dict) -> dict:
    """
    1ファイルを処理してCSVを出力する
    Returns: {"yayoi_csv": path, "review_csv": path, "stats": {...}}
    """
    logger = logging.getLogger("main")
    logger.info(f"=== 処理開始: {file_path} ===")

    # 初期化
    loader = OcrLoader(settings["ocr"]["column_mappings"])
    cleaner = DataCleaner()
    classifier = AccountClassifier(settings["rules_file"])
    formatter = YayoiFormatter(settings)

    # 読み込み
    df_raw = loader.load(file_path)

    # 処理
    rows = []
    stats = {"total": 0, "ok": 0, "review": 0, "error": 0}

    for i, raw_row in enumerate(df_raw.to_dict(orient="records"), start=1):
        stats["total"] += 1
        try:
            cleaned = cleaner.clean_row(raw_row)
            classification = classifier.classify(
                vendor=cleaned["vendor"],
                description=cleaned["description"],
                amount=cleaned["amount"],
            )

            # クレンジングのissuesがあれば要確認に
            if cleaned["issues"]:
                classification.needs_review = True
                logger.warning(f"行{i}: 要確認 {cleaned['issues']}")

            row = formatter.build_row(
                slip_no=i,
                cleaned=cleaned,
                classification=classification,
            )
            rows.append(row)

            if row["要確認"]:
                stats["review"] += 1
            else:
                stats["ok"] += 1

        except Exception as e:
            stats["error"] += 1
            logger.error(f"行{i} 処理エラー: {e}", exc_info=True)

    # DataFrame作成
    df_out = formatter.to_dataframe(rows)

    # 出力パス生成
    stem = Path(file_path).stem
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = Path(settings["output_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)

    yayoi_path = str(out_dir / f"{stem}_弥生取込_{ts}.csv")
    review_path = str(out_dir / f"{stem}_確認用_{ts}.csv")

    formatter.export_yayoi_csv(df_out, yayoi_path)
    formatter.export_review_csv(df_out, review_path)

    logger.info(
        f"完了: 合計{stats['total']}件 / 正常{stats['ok']}件 / 要確認{stats['review']}件 / エラー{stats['error']}件"
    )
    return {"yayoi_csv": yayoi_path, "review_csv": review_path, "stats": stats}


def main():
    settings = load_settings()
    setup_logging(settings["log_dir"])
    logger = logging.getLogger("main")

    # 処理対象ファイルを決定
    if len(sys.argv) > 1:
        files = [sys.argv[1]]
    else:
        input_dir = Path(settings["input_dir"])
        supported = settings["ocr"]["supported_formats"]
        files = [str(f) for f in input_dir.iterdir() if f.suffix.lower() in supported]
        if not files:
            logger.warning(f"input/ フォルダにファイルがありません: {input_dir.resolve()}")
            return

    for file_path in sorted(files):
        result = process_file(file_path, settings)
        print(f"\n[出力ファイル]")
        print(f"  弥生取込用: {result['yayoi_csv']}")
        print(f"  確認用:     {result['review_csv']}")
        s = result["stats"]
        print(f"  集計: {s['total']}件 / 正常{s['ok']} / 要確認{s['review']} / エラー{s['error']}")


if __name__ == "__main__":
    main()
