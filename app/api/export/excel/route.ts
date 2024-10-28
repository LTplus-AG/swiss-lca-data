import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const { materials, metadata } = await request.json();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create main materials worksheet
    const mainWs = XLSX.utils.json_to_sheet(materials);
    XLSX.utils.book_append_sheet(wb, mainWs, "KBOB Materials");

    // Create metadata worksheet
    const metadataWs = XLSX.utils.json_to_sheet([metadata.exportInfo]);
    XLSX.utils.book_append_sheet(wb, metadataWs, "Export Information");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kbob_materials_export_${
          new Date().toISOString().split("T")[0]
        }.xlsx"`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
