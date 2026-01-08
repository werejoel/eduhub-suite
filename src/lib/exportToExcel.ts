// Export utility for creating Excel files
export const exportToExcel = (data: any[], fileName: string) => {
  // Dynamic import to avoid build issues
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  });
};

export const exportMultipleSheets = (
  sheets: { name: string; data: any[] }[],
  fileName: string
) => {
  import("xlsx").then((XLSX) => {
    const wb = XLSX.utils.book_new();
    sheets.forEach((sheet) => {
      const ws = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  });
};

export const formatDataForExport = (data: any[], columns?: string[]) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  return data.map((item) => {
    const formattedItem: any = {};
    if (columns) {
      columns.forEach((col) => {
        formattedItem[col] = item[col];
      });
    } else {
      Object.keys(item).forEach((key) => {
        formattedItem[key] = item[key];
      });
    }
    return formattedItem;
  });
};
