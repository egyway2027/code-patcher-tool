/**
 * =========================================================
 * 📌 الملف: أداة التعديل الجراحي للأكواد (Code Patcher Tool)
 * 📁 المسار: src/components/tools/CodePatcher.jsx
 * 📝 الوظيفة: استبدال كتل الكود بدقة متناهية (SEARCH/REPLACE)
 *            دون تغيير أو المساس بباقي أسطر الملف.
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

  const handleApplyPatch = () => {
    if (!originalCode.trim() || !patchBlocks.trim()) {
      alert("يرجى إدخال الكود الأصلي وكتل التعديل أولاً.");
      return;
    }

    // Regex لمطابقة كتل البحث والاستبدال
    const blockRegex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> REPLACE/g;

    let currentCode = originalCode;
    let appliedCount = 0;
    let failedBlocks = [];
    let match;
    let index = 0;

    // استخراج وتطبيق الكتل واحدة تلو الأخرى
    while ((match = blockRegex.exec(patchBlocks)) !== null) {
      index++;
      const searchStr = match[1];
      const replaceStr = match[2];

      if (currentCode.includes(searchStr)) {
        currentCode = currentCode.replace(searchStr, replaceStr);
        appliedCount++;
      } else {
        failedBlocks.push({
          blockNum: index,
          snippet: searchStr.slice(0, 40) + "..."
        });
      }
    }

    setResultCode(currentCode);
    setStats({
      total: index,
      applied: appliedCount,
      failed: failedBlocks
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
            placeholder="الصق كود الملف الأصلي هنا..."
            rows={12}
            style={{
              width: "100%",
              background: themeStyles.inputBg || "#141414",
              border: `1px solid ${themeStyles.border || "#333"}`,
              borderRadius: 10,
              padding: 12,
              color: "#e0e0e0",
              fontFamily: "monospace",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none"
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
            placeholder={`<<<<<<< SEARCH\nالسطر المراد تغييره بالظبط\n=======\nالسطر الجديد البديل\n>>>>>>> REPLACE`}
            rows={12}
            style={{
              width: "100%",
              background: themeStyles.inputBg || "#141414",
              border: `1px solid ${themeStyles.border || "#333"}`,
              borderRadius: 10,
              padding: 12,
              color: "#e0e0e0",
              fontFamily: "monospace",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none"
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
              fontFamily: "monospace",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CodePatcher;
