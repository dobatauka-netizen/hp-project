"""
勘定科目自動判定モジュール
優先順位: 取引先名 > キーワード(摘要) > 金額補助ルール
"""
import re
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class ClassificationResult:
    debit_account: str          # 借方科目
    debit_sub_account: str      # 借方補助科目
    credit_account: str         # 貸方科目
    tax_category: str           # 税区分
    confidence: str             # high / medium / low
    matched_rule: str           # マッチしたルール説明
    needs_review: bool          # 要確認フラグ


class AccountClassifier:
    """勘定科目判定エンジン"""

    def __init__(self, rules_path: str):
        with open(rules_path, encoding="utf-8") as f:
            self.rules = json.load(f)

        self._compile_patterns()

    def _compile_patterns(self):
        """正規表現パターンを事前コンパイル"""
        self.vendor_compiled = [
            (re.compile(r["pattern"], re.IGNORECASE), r)
            for r in self.rules["vendor_rules"]
        ]
        self.keyword_compiled = [
            (re.compile(r["pattern"], re.IGNORECASE), r)
            for r in self.rules["keyword_rules"]
        ]

    def _determine_tax_category(self, account: str, description: str, tax_category_base: str) -> str:
        """軽減税率対象かどうかを判定"""
        reduced_keywords = self.rules["tax_rates"].get("reduced_keywords", [])
        for kw in reduced_keywords:
            if kw in description:
                return "課税仕入(軽8%)"
        return tax_category_base

    def _determine_credit_account(self, vendor: str, description: str) -> str:
        """貸方科目を判定（現金/クレジット/振込）"""
        defaults = self.rules["credit_account_defaults"]
        text = (vendor + " " + description).lower()

        for kw in defaults.get("cash_keywords", []):
            if kw.lower() in text:
                return "現金"
        for kw in defaults.get("credit_card_keywords", []):
            if kw.lower() in text:
                return "未払金"
        for kw in defaults.get("bank_keywords", []):
            if kw.lower() in text:
                return "普通預金"

        return defaults.get("default", "未払金")

    def classify(
        self,
        vendor: str,
        description: str,
        amount: Optional[int],
    ) -> ClassificationResult:
        """
        勘定科目を判定して返す
        優先順位: 取引先名 > キーワード > 金額補助 > デフォルト
        """
        combined_text = f"{vendor} {description}"
        credit_account = self._determine_credit_account(vendor, description)

        # ① 取引先名ベース
        for pattern, rule in self.vendor_compiled:
            if pattern.search(vendor):
                tax_cat = self._determine_tax_category(
                    rule["account"], combined_text, rule["tax_category"]
                )
                return ClassificationResult(
                    debit_account=rule["account"],
                    debit_sub_account=rule.get("sub_account", ""),
                    credit_account=credit_account,
                    tax_category=tax_cat,
                    confidence="high",
                    matched_rule=f"取引先: {rule.get('note', vendor)}",
                    needs_review=False,
                )

        # ② キーワードベース（摘要）
        for pattern, rule in self.keyword_compiled:
            if pattern.search(combined_text):
                tax_cat = self._determine_tax_category(
                    rule["account"], combined_text, rule["tax_category"]
                )
                return ClassificationResult(
                    debit_account=rule["account"],
                    debit_sub_account="",
                    credit_account=credit_account,
                    tax_category=tax_cat,
                    confidence="medium",
                    matched_rule=f"キーワード: {rule['pattern']}",
                    needs_review=False,
                )

        # ③ 金額補助ルール
        if amount is not None:
            for rule in self.rules["amount_rules"]:
                if "max_amount" in rule and amount <= rule["max_amount"]:
                    return ClassificationResult(
                        debit_account=rule["account"],
                        debit_sub_account="",
                        credit_account=credit_account,
                        tax_category="課税仕入",
                        confidence="low",
                        matched_rule=f"金額補助: {rule['note']}",
                        needs_review=rule.get("flag_review", True),
                    )
                if "min_amount" in rule and amount >= rule["min_amount"]:
                    return ClassificationResult(
                        debit_account="要確認",
                        debit_sub_account="",
                        credit_account=credit_account,
                        tax_category="課税仕入",
                        confidence="low",
                        matched_rule=f"金額補助: {rule['note']}",
                        needs_review=True,
                    )

        # ④ 判定不能 → 要確認
        logger.warning(f"勘定科目判定不能: vendor='{vendor}', desc='{description}'")
        return ClassificationResult(
            debit_account="要確認",
            debit_sub_account="",
            credit_account=credit_account,
            tax_category="課税仕入",
            confidence="none",
            matched_rule="ルール未マッチ",
            needs_review=True,
        )
