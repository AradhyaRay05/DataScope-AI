import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const report = await prisma.report.findFirst({
      where: { id, userId: session.userId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found." },
        { status: 404 }
      );
    }

    if (!fs.existsSync(report.filePath)) {
      return NextResponse.json(
        { error: "Report file not found on disk." },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(report.filePath);

    const mimeTypes: Record<string, string> = {
      json: "application/json",
      csv: "text/csv",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    };

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": mimeTypes[report.format] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${report.fileName}"`,
        "Content-Length": String(fileContent.length),
      },
    });
  } catch (error) {
    console.error("Download report error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const report = await prisma.report.findFirst({
      where: { id, userId: session.userId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found." },
        { status: 404 }
      );
    }

    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    await prisma.report.delete({ where: { id } });

    return NextResponse.json({ message: "Report deleted." });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
