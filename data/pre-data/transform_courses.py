import pandas as pd
from pathlib import Path

# 路徑
SRC_PRE = Path(__file__).parent / "courses.xlsx"
DST     = Path(__file__).parent.parent / "courses.xlsx"

# 通識 / 跨領域 categories
GENERAL_CATS = {
    "中文通識", "外文通識", "人文通識", "社會通識", "自然通識",
    "資訊通識", "書院通識",
    "跨領域(人文、社會)", "跨領域(人文、自然)", "跨領域(人文、資訊)",
    "跨領域(社會、自然)", "跨領域(社會、資訊)", "跨領域(自然、資訊)",
    "跨領域(人文、社會、自然)", "跨領域(人文、社會、資訊)",
    "跨領域(社會、自然、資訊)",
}

# 讀取資料
print("讀取 pre-data …")
pre = pd.read_excel(SRC_PRE, sheet_name="全部課程", dtype=str)

# 基礎欄位準備
pre["課號_padded"] = pre["課號"].str.zfill(9)
pre["semester"]    = pre["學年度"] + "-" + pre["學期"]

# category：lmtKind 優先，否則 subKind
def resolve_category(row):
    lmt = str(row.get("限修條件", "") or "").strip()
    if lmt and lmt not in ("nan", "None"):
        return lmt
    return str(row.get("必/選修", "") or "").strip()

# 建立 courses sheet
print("建立 courses …")
courses = pd.DataFrame({
    "year":        pre["學年度"].astype(int),
    "semester":    pre["semester"],
    "course_code": pre["課號_padded"],
    "course_name": pre["課程名稱"],
    "credits":     pre["學分"].astype(float),
    "dept":        pre["修課年級"],
    "level":       pre["修課班別"],
    "category":    pre.apply(resolve_category, axis=1),
})
print(f"  courses: {len(courses)} 筆")

# ── 建立 general_courses sheet ─────────────────────────────────────────────
print("建立 general_courses …")

pre["is_core_val"] = pre["核心課程"].apply(lambda x: 1 if str(x).strip() == "是" else 0)

general_mask = courses["category"].isin(GENERAL_CATS)
general_raw  = pre[general_mask].copy()
general_raw["course_code"] = general_raw["課號_padded"]
general_raw["course_name"] = general_raw["課程名稱"]
general_raw["category"]    = courses.loc[general_mask, "category"].values

general_dedup = (
    general_raw
    .groupby("course_code", sort=False)
    .agg(
        course_name=("course_name", "first"),
        category   =("category",    "first"),
        is_core    =("is_core_val", "max"),
    )
    .reset_index()
)[["course_code", "course_name", "category", "is_core"]]

print(f"  general_courses: {len(general_dedup)} 筆")

# 匯出 Excel
DST.parent.mkdir(parents=True, exist_ok=True)
print(f"\n寫出 {DST} …")
with pd.ExcelWriter(DST, engine="openpyxl") as writer:
    courses.to_excel(      writer, sheet_name="courses",         index=False)
    general_dedup.to_excel(writer, sheet_name="general_courses", index=False)

print("✓ 完成！")
print(f"\n[courses]         {len(courses)} 筆，欄位: {list(courses.columns)}")
print(f"[general_courses] {len(general_dedup)} 筆，欄位: {list(general_dedup.columns)}")
print(f"\ncourses 前 3 筆:\n{courses.head(3).to_string()}")
print(f"\ngeneral_courses 前 3 筆:\n{general_dedup.head(3).to_string()}")
