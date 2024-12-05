import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { processExcelData, saveMaterialsToDB } from "@/lib/kbob-service";

export async function POST(request: Request) {
  // Verify environment variables first
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json(
      {
        error: "Missing required environment variables. Please check your configuration.",
      },
      { status: 500 }
    );
  }

  // Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
  }

  // Verify the token (you should replace this with your actual token verification)
  const token = authHeader.split(' ')[1];
  if (token !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const version = formData.get("version") as string;
  const datePublished = formData.get("datePublished") as string;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const materials = processExcelData(workbook);

    // Save materials to your database or KV store
    await saveMaterialsToDB(materials);

    // Optionally, you can log or store the version and datePublished as needed
    console.log(`Version: ${version}, Date Published: ${datePublished}`);

    return NextResponse.json({
      success: true,
      materialsCount: materials.length,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Failed to process the uploaded file." },
      { status: 500 }
    );
  }
}
