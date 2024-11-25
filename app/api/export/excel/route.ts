import ExcelJS from 'exceljs';

export async function POST(request: Request) {
  try {
    const { materials, metadata } = await request.json();

    // Create workbook
    const wb = new ExcelJS.Workbook();

    // Create main materials worksheet
    const mainWs = wb.addWorksheet("KBOB Materials");
    
    // Add headers and data
    if (materials.length > 0) {
      const headers = Object.keys(materials[0]);
      mainWs.addRow(headers);
      materials.forEach(material => {
        mainWs.addRow(Object.values(material));
      });
    }

    // Create metadata worksheet
    const metadataWs = wb.addWorksheet("Export Information");
    if (metadata.exportInfo) {
      Object.entries(metadata.exportInfo).forEach(([key, value]) => {
        metadataWs.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value]);
      });
    }

    // Generate Excel file
    const buffer = await wb.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
