"""
データクレンジングモジュール
OCR出力データの正規化・異常値検出を担当
"""
import re
import logging
from datetime import datetime
from typing import Optional, Any
import pandas as pd

logger = logging.getLogger(__name__)


class DataCleaner:
    """OCRデータのクレンジング処理"""

    DATE_PATTERNS = [
        (r"(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})", "%Y/%m/%d"),
        (r"(\d{2})[/\-\.](\d{1,2})[/\-\.](\d{1,2})", "%y/%m/%d"),
        (r"令和(\d+)年(\d{1,2})月(\d{1,2})日", None),  # 和暦
        (r"R(\d+)\.(\d{1,2})\.(\d{1,2})", None),       # 和暦略記
    ]

    AMOUNT_PATTERN = re.compile(r"[^\d]")
    INVOICE_PATTERN = re.compile(r"T\d{13}", re.IGNORECASE)

    REIWA_START = 2018  # 令和元年 = 2019年

    def clean_date(self, raw: Any) -> Optional[str]:
        """日付を YYYY/MM/DD に正規化"""
        if pd.isna(raw) or raw == "":
            return None

        s = str(raw).strip()

        # pandasのTimestampの場合
        if isinstance(raw, (pd.Timestamp, datetime)):
            return raw.strftime("%Y/%m/%d")

        # 和暦変換（令和）
        m = re.match(r"令和(\d+)年(\d{1,2})月(\d{1,2})日", s)
        if m:
            year = int(m.group(1)) + self.REIWA_START
            return f"{year}/{int(m.group(2)):02d}/{int(m.group(3)):02d}"

        m = re.match(r"R(\d+)\.(\d{1,2})\.(\d{1,2})", s)
        if m:
            year = int(m.group(1)) + self.REIWA_START
            return f"{year}/{int(m.group(2)):02d}/{int(m.group(3)):02d}"

        # 平成変換
        m = re.match(r"平成(\d+)年(\d{1,2})月(\d{1,2})日", s)
        if m:
            year = int(m.group(1)) + 1988
            return f"{year}/{int(m.group(2)):02d}/{int(m.group(3)):02d}"

        # 西暦パターン
        m = re.match(r"(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})", s)
        if m:
            return f"{m.group(1)}/{int(m.group(2)):02d}/{int(m.group(3)):02d}"

        # 2桁年
        m = re.match(r"(\d{2})[/\-\.](\d{1,2})[/\-\.](\d{1,2})", s)
        if m:
            year = int(m.group(1)) + 2000
            return f"{year}/{int(m.group(2)):02d}/{int(m.group(3)):02d}"

        # 8桁数値 YYYYMMDD
        m = re.match(r"(\d{4})(\d{2})(\d{2})", s.replace("/", "").replace("-", ""))
        if m:
            return f"{m.group(1)}/{m.group(2)}/{m.group(3)}"

        logger.warning(f"日付解析失敗: '{s}'")
        return None

    def clean_amount(self, raw: Any) -> Optional[int]:
        """金額を整数に正規化（税込）"""
        if pd.isna(raw) or raw == "":
            return None

        s = str(raw).strip()

        # 負数チェック
        negative = s.startswith("-") or s.startswith("△") or s.startswith("▲")

        # 数字のみ抽出
        digits = self.AMOUNT_PATTERN.sub("", s)

        if not digits:
            logger.warning(f"金額解析失敗: '{s}'")
            return None

        amount = int(digits)
        return -amount if negative else amount

    def clean_text(self, raw: Any) -> str:
        """テキストの正規化（全角→半角など）"""
        if pd.isna(raw) or raw is None:
            return ""

        s = str(raw).strip()

        # 全角数字・英字を半角に
        s = s.translate(str.maketrans(
            "０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ",
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        ))

        # 余分な空白除去
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def extract_invoice_number(self, text: str) -> Optional[str]:
        """インボイス番号（T+13桁）を抽出"""
        if not text:
            return None
        m = self.INVOICE_PATTERN.search(text)
        return m.group(0).upper() if m else None

    def detect_anomalies(self, row: dict) -> list[str]:
        """異常値・要確認フラグの検出"""
        issues = []

        if row.get("date") is None:
            issues.append("日付不明")

        amount = row.get("amount")
        if amount is None:
            issues.append("金額不明")
        elif amount <= 0:
            issues.append("金額ゼロ以下")
        elif amount > 10_000_000:
            issues.append("高額（100万円超）")

        if not row.get("vendor") and not row.get("description"):
            issues.append("取引先・摘要ともに空")

        return issues

    def clean_row(self, raw_row: dict) -> dict:
        """1行分のデータをクレンジング"""
        vendor_raw = self.clean_text(raw_row.get("vendor", ""))
        description_raw = self.clean_text(raw_row.get("description", ""))

        # インボイス番号はvendor/descriptionから抽出を試みる
        invoice = (
            raw_row.get("invoice_number")
            or self.extract_invoice_number(vendor_raw)
            or self.extract_invoice_number(description_raw)
        )

        cleaned = {
            "date": self.clean_date(raw_row.get("date")),
            "amount": self.clean_amount(raw_row.get("amount")),
            "vendor": vendor_raw,
            "description": description_raw,
            "invoice_number": self.clean_text(invoice) if invoice else "",
        }

        cleaned["issues"] = self.detect_anomalies(cleaned)
        return cleaned
