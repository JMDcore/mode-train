import { NextResponse } from "next/server";

import { destroySession } from "@/server/auth/session";

async function handleLogout(request: Request) {
  await destroySession();

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/login",
    },
  });
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
