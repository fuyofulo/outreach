import { NextResponse } from "next/server";
import Papa from "papaparse";

import { csvRowFromThread } from "@/lib/csv";
import { getExportThreads } from "@/lib/outreach-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threads = await getExportThreads({
    q: searchParams.get("q") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
    statusId: searchParams.get("statusId") ?? undefined,
    campaignId: searchParams.get("campaignId") ?? undefined,
    due: searchParams.get("due") ?? undefined,
  });

  const csv = Papa.unparse(threads.map(csvRowFromThread));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="outreach-export.csv"',
    },
  });
}
