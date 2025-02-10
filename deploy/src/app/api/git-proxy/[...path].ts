import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function GET(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function POST(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function PUT(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

async function handleProxyRequest(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname.replace('/api/git-proxy/', '');
    if (!path) {
      return NextResponse.json({ error: 'Invalid proxy URL format' }, { status: 400 });
    }

    const targetURL = `https://${path}${req.nextUrl.search}`;

    const response = await fetch(targetURL, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers),
        host: new URL(targetURL).host,
      },
      body: ['GET', 'HEAD'].includes(req.method!) ? null : await req.arrayBuffer(),
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Git proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}

export const config = {
  matcher: '/api/git-proxy/:path*',
};
