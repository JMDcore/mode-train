import { NextResponse } from "next/server";

import { destroySession } from "@/server/auth/session";

async function handleLogout() {
  await destroySession();

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/login",
    },
  });
}

export async function GET() {
  return handleLogout();
}

export async function POST() {
  return handleLogout();
}
