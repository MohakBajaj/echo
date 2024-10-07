import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
  });
  if (token) {
    if (req.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (req.nextUrl.pathname.startsWith("/api/getStats")) {
      return NextResponse.next();
    }
  } else {
    if (req.nextUrl.pathname.startsWith("/")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
