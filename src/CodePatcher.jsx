/**
 * =========================================================
 * 📌 الملف: أداة التعديل الجراحي للأكواد (Code Patcher Tool)
 * 📁 المسار: src/components/tools/CodePatcher.jsx
 * 📝 الوظيفة: استبدال كتل الكود بدقة متناهية (SEARCH/REPLACE)
 *             دون تغيير أو المساس بباقي أسطر الملف مع معالجة مرنة
 *             للمسافات والسطور الفارغة.
 * =========================================================
 */

import React, { useState } from "react";
import { Code, CheckCircle, AlertTriangle, Copy, RefreshCw, Sparkles } from "lucide-react";

export function CodePatcher({ themeStyles = {} }) {
  const [originalCode, setOriginalCode] = useState("");
  const [patchBlocks, setPatchBlocks] = useState("");
  const [resultCode, setResultCode] = useState("");
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  // 🧹 إزالة وتوحيد المحارف غير المرئية والمسافات الصفرية والـ Non-breaking spaces
  const cleanInvisibleChars = (str) => {
    if (!str) return "";
    return str
      .replace(/\r\n/g, "\n")
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
      .replace(/[\u200B-\u200D\u2060]/g, "");
  };

  // 🧹 توحيد المسافات الداخلية المتكررة (مسافات/تابات متعددة) إلى مسافة واحدة + إزالة البادئة/النهاية
  const collapseWhitespace = (str) => (str || "").trim().replace(/[ \t]+/g, " ");

  // 🧠 حساب نسبة التشابه بين سطرين/كتلتين (Levenshtein Distance Ratio)
  const similarityRatio = (a, b) => {
    const la = a.length, lb = b.length;
    if (la === 0 && lb === 0) return 1;
    if (la === 0 || lb === 0) return 0;
    // حماية بسيطة من البطء الشديد على النصوص الطويلة جدًا
    if (la > 4000 || lb > 4000) return a === b ? 1 : 0;

    let prevRow = new Array(lb + 1);
    let currRow = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prevRow[j] = j;

    for (let i = 1; i <= la; i++) {
      currRow[0] = i;
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          prevRow[j] + 1,        // حذف
          currRow[j - 1] + 1,    // إضافة
          prevRow[j - 1] + cost  // استبدال
        );
      }
      [prevRow, currRow] = [currRow, prevRow];
    }

    const dist = prevRow[lb];
    return 1 - dist / Math.max(la, lb);
  };

  // 🧠 خوارزمية الاستبدال الجراحي متعددة المستويات
  const applyFuzzyReplace = (sourceText, searchStr, replaceStr) => {
    // 1. التطابق الحرفي المباشر
    if (sourceText.includes(searchStr)) {
      return { success: true, text: sourceText.replace(searchStr, replaceStr), level: "exact" };
    }

    const normSource = cleanInvisibleChars(sourceText);
    const normSearch = cleanInvisibleChars(searchStr);
    const normReplace = cleanInvisibleChars(replaceStr);

    // 2. التطابق بعد توحيد المسافات والمحارف الخفية
    if (normSource.includes(normSearch)) {
      return { success: true, text: normSource.replace(normSearch, normReplace), level: "cleaned" };
    }

    // 3. مطابقة الأسطر مع تجاهل الفراغات البادئة والنهائية (Line-by-Line Trimmed Matching)
    const sourceLines = normSource.split("\n");
    const rawSearchLines = normSearch.split("\n");

    let startIdx = 0;
    while (startIdx < rawSearchLines.length && rawSearchLines[startIdx].trim() === "") startIdx++;
    let endIdx = rawSearchLines.length - 1;
    while (endIdx >= startIdx && rawSearchLines[endIdx].trim() === "") endIdx--;

    const searchLines = rawSearchLines.slice(startIdx, endIdx + 1);
    if (searchLines.length === 0) return { success: false, text: sourceText };

    const replaceLines = normReplace.split("\n");

    for (let i = 0; i <= sourceLines.length - searchLines.length; i++) {
      let isMatch = true;
      for (let j = 0; j < searchLines.length; j++) {
        if (sourceLines[i + j].trim() !== searchLines[j].trim()) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        const newLines = [...sourceLines];
        newLines.splice(i, searchLines.length, ...replaceLines);
        return { success: true, text: newLines.join("\n"), level: "trimmed" };
      }
    }

    // 4. مطابقة الأسطر مع تجاهل حالة الأحرف (Capital/Small) + توحيد المسافات الداخلية المتكررة
    for (let i = 0; i <= sourceLines.length - searchLines.length; i++) {
      let isMatch = true;
      for (let j = 0; j < searchLines.length; j++) {
        if (
          collapseWhitespace(sourceLines[i + j]).toLowerCase() !==
          collapseWhitespace(searchLines[j]).toLowerCase()
        ) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        const newLines = [...sourceLines];
        newLines.splice(i, searchLines.length, ...replaceLines);
        return { success: true, text: newLines.join("\n"), level: "case-insensitive" };
      }
    }

    // 5. مطابقة تقريبية (Fuzzy) كملاذ أخير — بنسبة تشابه ≥ 88%
    //    (تُستخدم فقط عند وجود اختلافات طفيفة كحروف زائدة/ناقصة أو رموز بسيطة)
    if (searchLines.length <= 60) {
      const searchJoined = searchLines
        .map((l) => collapseWhitespace(l).toLowerCase())
        .join("\n");

      let bestIdx = -1;
      let bestScore = 0;

      for (let i = 0; i <= sourceLines.length - searchLines.length; i++) {
        const chunkJoined = sourceLines
          .slice(i, i + searchLines.length)
          .map((l) => collapseWhitespace(l).toLowerCase())
          .join("\n");

        const score = similarityRatio(chunkJoined, searchJoined);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1 && bestScore >= 0.88) {
        const newLines = [...sourceLines];
        newLines.splice(bestIdx, searchLines.length, ...replaceLines);
        return {
          success: true,
          text: newLines.join("\n"),
          level: "fuzzy",
          score: bestScore
        };
      }
    }

    return { success: false, text: sourceText };
  };

  const handleApplyPatch = () => {
    if (!originalCode.trim() || !patchBlocks.trim()) {
      alert("يرجى إدخال الكود الأصلي وكتل التعديل أولاً.");
      return;
    }

    // Regex مرن يتقبل مسافات الزوائد وصيغتي SEARCH / REPLACE
    const blockRegex = /(?:<{7}\s*SEARCH|SEARCH\s*>{7})[^\n]*\n([\s\S]*?)\n(?:={7}|={6})[^\n]*\n([\s\S]*?)\n(?:>{7}\s*REPLACE|REPLACE\s*<{7})/g;

    let currentCode = originalCode;
    let appliedCount = 0;
    let failedBlocks = [];
    let warningBlocks = [];
    let match;
    let index = 0;

    const normalizedPatches = cleanInvisibleChars(patchBlocks);

    const levelLabels = {
      "case-insensitive": "تجاهل حالة الأحرف (Capital/Small) + توحيد المسافات",
      fuzzy: "مطابقة تقريبية (Fuzzy)"
    };

    while ((match = blockRegex.exec(normalizedPatches)) !== null) {
      index++;
      const searchStr = match[1];
      const replaceStr = match[2];

      const res = applyFuzzyReplace(currentCode, searchStr, replaceStr);

      if (res.success) {
        currentCode = res.text;
        appliedCount++;

        if (res.level === "case-insensitive" || res.level === "fuzzy") {
          warningBlocks.push({
            blockNum: index,
            reason: levelLabels[res.level],
            score: res.score,
            snippet: searchStr.trim().split("\n")[0].slice(0, 45) + "..."
          });
        }
      } else {
        failedBlocks.push({
          blockNum: index,
          snippet: searchStr.trim().split("\n")[0].slice(0, 45) + "..."
        });
      }
    }

    setResultCode(currentCode);
    setStats({
      total: index,
      applied: appliedCount,
      failed: failedBlocks,
      warnings: warningBlocks
    });
    setCopied(false);
  };

  const handleCopy = () => {
    if (!resultCode) return;
    navigator.clipboard.writeText(resultCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setOriginalCode("");
    setPatchBlocks("");
    setResultCode("");
    setStats(null);
    setCopied(false);
  };

  return (
    <div style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: 20,
      fontFamily: "'Cairo', 'Tajawal', sans-serif",
      color: themeStyles.text || "#ffffff"
    }}>
      {/* 1. الشريط العلوي للأداة */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: themeStyles.card || "#1e1e1e",
        border: `1px solid ${themeStyles.border || "#333333"}`,
        borderRadius: 16,
        padding: "16px 24px",
        marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={24} style={{ color: themeStyles.accentGold || "#d4af37" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: themeStyles.accentGold || "#d4af37" }}>
              أداة التعديل الجراحي للأكواد (Code Patcher)
            </h2>
            <span style={{ fontSize: 12, color: themeStyles.subText || "#aaaaaa" }}>
              تعديل أسطر محددة فقط مع تجميد وحماية باقي الملف 100%
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: `1px solid ${themeStyles.border || "#333"}`,
            color: themeStyles.subText || "#aaa", padding: "8px 14px",
            borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700
          }}
        >
          <RefreshCw size={14} /> تفريغ الخانات
        </button>
      </div>

      {/* 2. مربعات الإدخال */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* المربع 1: الكود الأصلي */}
        <div style={{ background: themeStyles.card || "#1e1e1e", border: `1px solid ${themeStyles.border || "#333"}`, borderRadius: 14, padding: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 8, color: themeStyles.accentGold || "#d4af37" }}>
            1. الكود الأصلي للملف بالكامل:
          </label>
          <textarea
            value={originalCode}
            onChange={(e) => setOriginalCode(e.target.value)}
            placeholder="// الصق كود الملف الأصلي هنا..."
            rows={12}
            style={{
              width: "100%",
              background: themeStyles.inputBg || "#141414",
              border: `1px solid ${themeStyles.border || "#333"}`,
              borderRadius: 10,
              padding: 12,
              color: "#e0e0e0",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
              direction: "ltr",
              textAlign: "left",
              unicodeBidi: "plaintext",
              whiteSpace: "pre"
            }}
          />
        </div>

        {/* المربع 2: كتل التعديل */}
        <div style={{ background: themeStyles.card || "#1e1e1e", border: `1px solid ${themeStyles.border || "#333"}`, borderRadius: 14, padding: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#e07a5f" }}>
            2. كتل التعديل (SEARCH / REPLACE):
          </label>
          <textarea
            value={patchBlocks}
            onChange={(e) => setPatchBlocks(e.target.value)}
            placeholder={`<<<<<<< SEARCH\nالسطر المراد تغييره\n=======\nالسطر الجديد البديل\n>>>>>>> REPLACE`}
            rows={12}
            style={{
              width: "100%",
              background: themeStyles.inputBg || "#141414",
              border: `1px solid ${themeStyles.border || "#333"}`,
              borderRadius: 10,
              padding: 12,
              color: "#e0e0e0",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
              direction: "ltr",
              textAlign: "left",
              unicodeBidi: "plaintext",
              whiteSpace: "pre"
            }}
          />
        </div>
      </div>

      {/* 3. زر التشغيل */}
      <button
        onClick={handleApplyPatch}
        style={{
          width: "100%",
          padding: 16,
          background: "linear-gradient(135deg, #d4af37 0%, #b06a35 100%)",
          border: "none",
          borderRadius: 12,
          color: "#111",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
          marginBottom: 20
        }}
      >
        <Code size={18} /> تطبيق التعديل الجراحي على الكود
      </button>

      {/* 4. النتيجة والإحصائيات */}
      {stats && (
        <div style={{ background: themeStyles.card || "#1e1e1e", border: `1px solid ${themeStyles.border || "#333"}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#22c55e", fontWeight: 700, fontSize: 13 }}>
                <CheckCircle size={16} /> تم تطبيق {stats.applied} من أصل {stats.total} كتل بنجاح
              </div>

              {stats.failed.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
                  <AlertTriangle size={16} /> فشل مطابقة {stats.failed.length} كتل
                </div>
              )}
            </div>

            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: copied ? "#22c55e" : themeStyles.accentGold || "#d4af37",
                border: "none", color: "#111", padding: "8px 16px",
                borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13
              }}
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? "تم النسخ!" : "نسخ الكود النهائي"}
            </button>
          </div>

          {stats.warnings && stats.warnings.length > 0 && (
            <div style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid #eab308", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#facc15" }}>
              <strong>⚠️ تنبيه: الكتل التالية تم تطبيقها بمطابقة مرنة وليست حرفية 100% — يُفضّل مراجعتها في الناتج:</strong>
              <ul style={{ margin: "6px 0 0 0", paddingRight: 20 }}>
                {stats.warnings.map((w, i) => (
                  <li key={i}>
                    كتلة رقم {w.blockNum}: "{w.snippet}" — السبب: {w.reason}
                    {typeof w.score === "number" ? ` (تشابه ${Math.round(w.score * 100)}%)` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.failed.length > 0 && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#f87171" }}>
              <strong>تنبيه: الكتل التالية لم يتم العثور على نصها الأصلي بالكود:</strong>
              <ul style={{ margin: "6px 0 0 0", paddingRight: 20 }}>
                {stats.failed.map((f, i) => (
                  <li key={i}>كتلة رقم {f.blockNum}: "{f.snippet}"</li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            readOnly
            value={resultCode}
            rows={14}
            style={{
              width: "100%",
              background: themeStyles.inputBg || "#141414",
              border: `1px solid ${themeStyles.border || "#333"}`,
              borderRadius: 10,
              padding: 12,
              color: "#22c55e",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
              direction: "ltr",
              textAlign: "left",
              unicodeBidi: "plaintext",
              whiteSpace: "pre"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CodePatcher;
