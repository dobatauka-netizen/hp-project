"""AccountClassifierのユニットテスト"""
import pytest
from src.classifier import AccountClassifier

clf = AccountClassifier("config/account_rules.json")


@pytest.mark.parametrize("vendor,desc,amount,expected_account,expected_confidence", [
    ("ENEOS",          "ガソリン給油",   5000,  "車両費",   "high"),
    ("セブンイレブン", "飲料購入",       500,   "会議費",   "high"),
    ("Amazon",         "消耗品",         3000,  "消耗品費", "high"),
    ("",               "会議費 打合せ",  2000,  "会議費",   "medium"),
    ("",               "ガソリン代",     4000,  "車両費",   "medium"),
    ("不明業者",       "不明取引",       800,   "雑費",     "low"),   # 金額補助
])
def test_classify(vendor, desc, amount, expected_account, expected_confidence):
    result = clf.classify(vendor, desc, amount)
    assert result.debit_account == expected_account
    assert result.confidence == expected_confidence


def test_classify_needs_review_for_unknown():
    result = clf.classify("謎の業者ABC", "詳細不明", 50000)
    assert result.needs_review is True
