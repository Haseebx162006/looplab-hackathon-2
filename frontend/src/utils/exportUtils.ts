"use client";

export function exportToPDF(
  title: string,
  subtitle?: string,
  headers?: string[],
  rows?: any[][],
  filename: string = "report.json"
) {
  const data = { title, subtitle, headers, rows };
  console.log("Exporting to PDF...", data);
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  filename: string,
  headers?: string[],
  rows?: any[][]
) {
  console.log("Exporting to Excel...", { filename, headers, rows });
  const csvHeaders = headers ? headers.join(",") : "";
  const csvRows = rows
    ? rows.map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
    : [];
  const csvContent = [csvHeaders, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
