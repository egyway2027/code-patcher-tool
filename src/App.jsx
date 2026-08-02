import React from "react";
import CodePatcher from "./CodePatcher";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#121212", paddingTop: "20px" }}>
      <CodePatcher themeStyles={{ card: "#1e1e1e", border: "#333333", text: "#ffffff" }} />
    </div>
  );
}
