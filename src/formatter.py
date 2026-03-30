"""
弥生会計 仕訳CSVフォーマット生成モジュール
弥生会計 仕訳日記帳インポート仕様に準拠
"""
import io
import logging
from pathlib import Path
from datetime import datetime
import pandas as pd

logger = logging.getLogger(__name__)

# 弥生会計 仕訳インポートCSVのカラム定義
YAYOI_COLUMNS = [
    "伝票No",
    "日付",
    "借方科目",
    "借方補助科目",
    "借方税区分",
    "借方金額",
    "借方消費税額",
    "貸方科目",
    "貸方補助科目",
    "貸方税区分",
    "貸方金額",
    "貸方消費税額",
    "摘要",
    "番号",        # インボイス番号 / 伝票番号
    "要確認",      # 弥生標準外: レビュー後に削除
    "判定根拠",    # 弥生標準外: レビュー後に削除
]

# 弥生会計へ実際に出力するカラム（標準カラムのみ）
YAYOI_EXPORT_COLUMNS = [
    "伝票No", "日付", "借方科目", "借方補助科目", "借方税区分",
    "借方金額", "借方消費税額", "貸方科目", "貸方補助科目",
    "貸方税区分", "貸方金額", "貸方消費税額", "摘要", "番号"
]

TAX_RATES = {
    "課税仕入": 0.10,
    "課税仕入(軽8%)": 0.08,
    "非課税仕入": 0.00,
    "不課税": 0.00,
}


def calc_tax(amount: int, tax_category: str) -> int:
    """税込金額から消費税額を算出"""
    rate = TAX_RATES.get(tax_category, 0.10)
    if rate == 0:
        return 0
    # 税込金額 ÷ (1 + 税率) × 税率 = 消費税額（端数切捨て）
    return int(amount * rate / (1 + rate))


class YayoiFormatter:
    """弥生会計用CSVフォーマッター"""

    def __init__(self, settings: dict):
        self.settings = settings
        self.yayoi_cfg = settings.get("yayoi", {})

    def build_row(
        self,
        slip_no: int,
        cleaned: dict,
        classification,
    ) -> dict:
        """1仕訳分の弥生CSVデータを構築"""
        amount = cleaned.get("amount") or 0
        tax_amount = calc_tax(amount, classification.tax_category)

        description = cleaned.get("description") or cleaned.get("vendor") or ""
        if cleaned.get("vendor") and cleaned.get("description"):
            description = f"{cleaned['vendor']} {cleaned['description']}"

        return {
            "伝票No": slip_no,
            "日付": cleaned.get("date") or "",
            "借方科目": classification.debit_account,
            "借方補助科目": classification.debit_sub_account,
            "借方税区分": classification.tax_category,
            "借方金額": amount,
            "借方消費税額": tax_amount,
            "貸方科目": classification.credit_account,
            "貸方補助科目": "",
            "貸方税区分": "",
            "貸方金額": amount,
            "貸方消費税額": 0,
            "摘要": description[:50],  # 弥生の摘要文字数制限
            "番号": cleaned.get("invoice_number") or "",
            "要確認": "★" if classification.needs_review or cleaned.get("issues") else "",
            "判定根拠": classification.matched_rule,
        }

    def to_dataframe(self, rows: list[dict]) -> pd.DataFrame:
        return pd.DataFrame(rows, columns=YAYOI_COLUMNS)

    def export_yayoi_csv(self, df: pd.DataFrame, output_path: str) -> str:
        """
        弥生会計インポート用CSVを出力
        エンコーディング: Shift-JIS (cp932)
        """
        export_df = df[YAYOI_EXPORT_COLUMNS].copy()

        # 弥生会計のCSVヘッダー行（仕様準拠）
        header_line = '"仕訳日記帳","","","","","","","","","","","","",""'

        output = io.StringIO()
        output.write(header_line + "\n")
        export_df.to_csv(output, index=False, encoding="utf-8")

        csv_content = output.getvalue()

        # Shift-JIS で書き出し
        with open(output_path, "w", encoding="cp932", errors="replace", newline="\r\n") as f:
            f.write(header_line + "\r\n")
            export_df.to_csv(f, index=False, encoding="cp932", errors="replace", lineterminator="\r\n")

        logger.info(f"弥生CSV出力完了: {output_path}")
        return output_path

    def export_review_csv(self, df: pd.DataFrame, output_path: str) -> str:
        """
        確認用CSV（全カラム含む）をUTF-8で出力
        要確認フラグ付き行を先頭に並び替え
        """
        df_sorted = pd.concat([
            df[df["要確認"] == "★"],
            df[df["要確認"] != "★"],
        ]).reset_index(drop=True)

        df_sorted.to_csv(output_path, index=False, encoding="utf-8-sig")
        logger.info(f"確認用CSV出力完了: {output_path} ({len(df[df['要確認']=='★'])}件要確認)")
        return output_path
