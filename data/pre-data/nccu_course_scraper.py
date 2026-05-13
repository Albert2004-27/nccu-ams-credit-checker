"""
政大全校課程爬蟲 (111-1 ~ 114-2)
資料來源: https://qrysub.nccu.edu.tw/
API: https://es.nccu.edu.tw/course/zh-TW/

已知漏網單位：
  AI中心（人工智慧研究中心）— 不在 unit.json 系所架構中，
  無 dp1 代碼可查，改用課程名稱關鍵字補查。
"""

import requests
import json
import time
import ssl
import pandas as pd
from pathlib import Path
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
from urllib3.util.ssl_ import create_urllib3_context

BASE_URL = "https://es.nccu.edu.tw/course/zh-TW/"
UNIT_URL = "https://qrysub.nccu.edu.tw/assets/api/unit.json"

# AI中心課程不在 unit.json → 以課程名稱關鍵字補查
# 若未來新增課程，在此加入對應關鍵字即可
AI_CENTER_KEYWORDS = [
    "計算思維與人工智慧應用導論",
    "人工智慧方法與工具",
    "人工智慧實務專題",
]

# dp 分類不完整的課程 → 同樣以關鍵字補查（不限定 subGde）
# 已知案例：多媒體與程式設計軟體（000357x）在 111-1~113-2 不在任何 dp 下
KEYWORD_SUPPLEMENTS = [
    "多媒體與程式設計軟體",
]


class LegacyTLSAdapter(HTTPAdapter):
    """允許伺服器使用舊版 TLS 重新協商"""
    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.options |= 0x4  # OP_LEGACY_SERVER_CONNECT
        kwargs["ssl_context"] = ctx
        self.poolmanager = PoolManager(*args, **kwargs)


def make_session():
    s = requests.Session()
    adapter = LegacyTLSAdapter()
    s.mount("https://", adapter)
    return s


SESSION = make_session()
SEMESTERS = [
    ("111", "1"), ("111", "2"),
    ("112", "1"), ("112", "2"),
    ("113", "1"), ("113", "2"),
    ("114", "1"), ("114", "2"),
]
MAX_RECORDS = 500  # API 上限

COLUMNS_ZH = {
    "y": "學年度",
    "s": "學期",
    "subNum": "課號",
    "subOdr": "課序",
    "subNam": "課程名稱",
    "subKind": "必/選修",
    "subPoint": "學分",
    "subGde": "修課年級",
    "teaNam": "教師",
    "subTime": "上課時間",
    "subClassroom": "教室",
    "langTpe": "授課語言",
    "smtQty": "學期類別",
    "gdeType": "修課班別",
    "core": "核心課程",
    "emiType": "EMI",
    "pay": "收費",
    "gdeTpe": "甄試",
    "tranTpe": "選課方式",
    "lmtKind": "限修條件",
    "note": "備註",
    "info": "異動資訊",
    "far": "遠距學習",
    "subSetUrl": "課程大綱",
    "teaSchmUrl": "教師課表",
    "teaExpUrl": "教師著作",
    "subRemainUrl": "餘額查詢",
    "subLocUrl": "開課地點",
    "subUnitRuleUrl": "選課規定",
    "isTrace": "追蹤",
    "gdeTpeMsg": "甄試說明",
}


def get_all_dept_codes():
    """取得所有系所代碼，回傳 (L1, L2) 組合清單"""
    resp = SESSION.get(UNIT_URL, timeout=15, verify=False)
    resp.raise_for_status()
    data = resp.json()

    dept_pairs = []
    for l1 in data:
        if l1["utCodL1"] == "0":
            continue
        has_l2 = any(l2["utCodL2"] != "0" for l2 in l1["utL2"])
        if has_l2:
            for l2 in l1["utL2"]:
                if l2["utCodL2"] != "0":
                    dept_pairs.append((l1["utCodL1"], l2["utCodL2"]))
        else:
            dept_pairs.append((l1["utCodL1"], None))
    return dept_pairs


def fetch_courses(sem_code, dp1=None, dp2=None, dp3=None):
    """
    呼叫 API 取得課程資料
    sem_code: e.g. "1142"
    """
    query = f":sem={sem_code} "
    if dp1:
        query += f":dp1={dp1} "
    if dp2:
        query += f":dp2={dp2} "
    if dp3:
        query += f":dp3={dp3} "

    url = BASE_URL + query + "/"
    resp = SESSION.get(url, timeout=30, verify=False)
    resp.raise_for_status()
    return resp.json()


def fetch_courses_by_keyword(sem_code, keyword):
    """以課程名稱關鍵字搜尋，補查無 dp1 代碼的單位（如 AI中心）"""
    from urllib.parse import quote
    url = BASE_URL + f":sem={sem_code} {quote(keyword)} /"
    resp = SESSION.get(url, timeout=30, verify=False)
    resp.raise_for_status()
    return resp.json()


def scrape_semester(year, sem):
    """爬取一個學期的所有課程"""
    sem_code = year + sem
    sem_name = f"{year}-{sem}"
    print(f"\n{'='*50}")
    print(f"爬取 {sem_name} 學期...")

    dept_pairs = get_all_dept_codes()
    all_courses = {}  # 用 subNum 去重

    for dp1, dp2 in dept_pairs:
        label = f"{dp1}/{dp2}" if dp2 else dp1
        try:
            courses = fetch_courses(sem_code, dp1=dp1, dp2=dp2)
            new_count = 0
            for c in courses:
                key = c.get("subNum", "")
                if key and key not in all_courses:
                    all_courses[key] = c
                    new_count += 1

            print(f"  [{label}] {len(courses)} 筆 (新增 {new_count} 筆)")

            if len(courses) >= MAX_RECORDS:
                print(f"  ⚠  [{label}] 達到上限 {MAX_RECORDS}，可能有遺漏！")

            time.sleep(0.3)

        except Exception as e:
            print(f"  ✗ [{label}] 錯誤: {e}")
            time.sleep(1)

    # ── 補查 AI中心（unit.json 未列出，無 dp1 代碼）──────────────────────────
    ai_new = 0
    for kw in AI_CENTER_KEYWORDS:
        try:
            kw_courses = fetch_courses_by_keyword(sem_code, kw)
            for c in kw_courses:
                if c.get("subGde") == "AI中心":
                    key = c.get("subNum", "")
                    if key and key not in all_courses:
                        all_courses[key] = c
                        ai_new += 1
            time.sleep(0.2)
        except Exception as e:
            print(f"  ✗ [AI中心/{kw[:8]}…] 錯誤: {e}")

    if ai_new:
        print(f"  [AI中心補查] 新增 {ai_new} 筆")

    # ── 補查 dp 分類不完整的課程 ────────────────────────────────────────────
    kw_new = 0
    for kw in KEYWORD_SUPPLEMENTS:
        try:
            kw_courses = fetch_courses_by_keyword(sem_code, kw)
            for c in kw_courses:
                key = c.get("subNum", "")
                if key and key not in all_courses:
                    all_courses[key] = c
                    kw_new += 1
            time.sleep(0.2)
        except Exception as e:
            print(f"  ✗ [補查/{kw[:10]}…] 錯誤: {e}")

    if kw_new:
        print(f"  [關鍵字補查] 新增 {kw_new} 筆")

    result = list(all_courses.values())
    print(f"  → {sem_name} 共 {len(result)} 門課程")
    return result


def main():
    print("政大全校課程爬蟲 (111-1 ~ 114-2)")
    print("=" * 50)

    all_records = []
    for year, sem in SEMESTERS:
        courses = scrape_semester(year, sem)
        all_records.extend(courses)
        time.sleep(0.5)

    print(f"\n總計爬取 {len(all_records)} 筆課程資料")

    # 轉換為 DataFrame
    df = pd.DataFrame(all_records)

    # 重新排列欄位順序
    ordered_cols = [c for c in COLUMNS_ZH.keys() if c in df.columns]
    remaining = [c for c in df.columns if c not in ordered_cols]
    df = df[ordered_cols + remaining]

    # 重新命名欄位
    rename_map = {k: v for k, v in COLUMNS_ZH.items() if k in df.columns}
    df = df.rename(columns=rename_map)

    # 儲存 Excel
    output_path = Path(__file__).parent / "courses.xlsx"
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # 總表
        df.to_excel(writer, sheet_name="全部課程", index=False)

        # 每學期分頁
        for year, sem in SEMESTERS:
            mask = (df["學年度"] == year) & (df["學期"] == sem)
            subset = df[mask]
            if not subset.empty:
                sheet_name = f"{year}-{sem}"
                subset.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"  工作表 [{sheet_name}]: {len(subset)} 筆")

    print(f"\n✓ Excel 已儲存至: {output_path}")
    print(f"✓ Python 腳本位於: {Path(__file__)}")


if __name__ == "__main__":
    main()
