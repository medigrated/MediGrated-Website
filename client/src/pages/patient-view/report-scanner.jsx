"use client";
import React from "react";

export default function ReportScanner() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-5xl h-full shadow-lg rounded-xl overflow-hidden border">
        <iframe
          src="http://localhost:8501/"
          title="Medical Report Analyzer"
          className="w-full h-full"
          style={{
            border: "none",
          }}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
