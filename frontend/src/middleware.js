import { NextResponse } from "next/server";

const PUBLIC_PATHS    = ["/login", "/signup"];

// `src/pages/` doubles as the Pages Router directory, so components living
// there are also served as routes (e.g. /gis/GISPage). Those bypass the
// /bhoomi guard, so the GIS route is listed explicitly.
const PROTECTED_PREFIXES = ["/bhoomi", "/gis"];

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("crm_auth_token")?.value;

    if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (PUBLIC_PATHS.includes(pathname) && token) {
        return NextResponse.redirect(new URL("/bhoomi/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/signup",
        "/bhoomi/:path*",
        "/gis/:path*",
    ],
};