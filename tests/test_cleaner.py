"""DataCleanerのユニットテスト"""
import pytest
from src.cleaner import DataCleaner

c = DataCleaner()


@pytest.mark.parametrize("raw,expected", [
    ("2024/1/5",    "2024/01/05"),
    ("2024-01-05",  "2024/01/05"),
    ("令和6年1月5日", "2024/01/05"),
    ("R6.1.5",      "2024/01/05"),
    ("20240105",    "2024/01/05"),
    ("",            None),
])
def test_clean_date(raw, expected):
    assert c.clean_date(raw) == expected


@pytest.mark.parametrize("raw,expected", [
    ("1,234",    1234),
    ("¥5,000",   5000),
    ("10000円",  10000),
    ("△500",     -500),
    ("",         None),
])
def test_clean_amount(raw, expected):
    assert c.clean_amount(raw) == expected


def test_extract_invoice_number():
    assert c.extract_invoice_number("登録番号T1234567890123") == "T1234567890123"
    assert c.extract_invoice_number("インボイスなし") is None


def test_detect_anomalies_ok():
    row = {"date": "2024/01/05", "amount": 1000, "vendor": "ENEOS", "description": "ガソリン"}
    assert c.detect_anomalies(row) == []


def test_detect_anomalies_missing_date():
    row = {"date": None, "amount": 1000, "vendor": "ENEOS", "description": ""}
    issues = c.detect_anomalies(row)
    assert "日付不明" in issues
