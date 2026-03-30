"""
OCRデータ読み込みモジュール
Excel / CSV 両対応、カラム名の自動マッピング
"""
import logging
from pathlib import Path
import pandas as pd

logger = logging.getLogger(__name__)


class OcrLoader:
    """OCR出力ファイルの読み込みと列名正規化"""

    def __init__(self, column_mappings: dict):
        """
        column_mappings: settings.json の ocr.column_mappings
        例: {"date": ["日付", "Date", ...], "amount": ["金額", ...]}
        """
        self.column_mappings = column_mappings

    def load(self, file_path: str) -> pd.DataFrame:
        """ファイルを読み込んでDataFrameを返す"""
        path = Path(file_path)
        suffix = path.suffix.lower()

        if suffix in (".xlsx", ".xls"):
            df = pd.read_excel(path, dtype=str)
        elif suffix == ".csv":
            # エンコーディング自動検出
            for enc in ("utf-8-sig", "cp932", "utf-8"):
                try:
                    df = pd.read_csv(path, dtype=str, encoding=enc)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError(f"エンコーディング検出失敗: {file_path}")
        else:
            raise ValueError(f"未対応のファイル形式: {suffix}")

        logger.info(f"読み込み完了: {file_path} ({len(df)}行, 列: {list(df.columns)})")
        return self._normalize_columns(df)

    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """列名を正規化キー（date/amount/vendor等）にマッピング"""
        rename_map = {}
        df_cols_lower = {c.lower().strip(): c for c in df.columns}

        for canonical, aliases in self.column_mappings.items():
            for alias in aliases:
                if alias.lower() in df_cols_lower:
                    original = df_cols_lower[alias.lower()]
                    rename_map[original] = canonical
                    break

        df = df.rename(columns=rename_map)

        # 必須列が不足している場合は空列を追加
        for col in ("date", "amount", "vendor", "description", "invoice_number"):
            if col not in df.columns:
                df[col] = ""
                logger.warning(f"列 '{col}' が見つからないため空列を追加しました")

        return df
