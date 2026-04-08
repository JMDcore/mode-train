import { NextResponse } from "next/server";

import { getDbPool, hasDatabaseConfig } from "@/server/db/client";

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!hasDatabaseConfig) {
    return NextResponse.json({
      status: "ok",
      service: "mode-train",
      timestamp,
      database: {
        configured: false,
        ok: false,
      },
    });
  }

  try {
    const pool = getDbPool();
    await pool.query("select 1");

    return NextResponse.json({
      status: "ok",
      service: "mode-train",
      timestamp,
      database: {
        configured: true,
        ok: true,
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "mode-train",
        timestamp,
        database: {
          configured: true,
          ok: false,
        },
      },
      { status: 503 },
    );
  }
}
