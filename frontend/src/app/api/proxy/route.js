export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      return Response.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Proxy fazendo requisição para:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'IRQ-Watcher-Proxy/1.0',
      },
    });

    if (!response.ok) {
      console.error('❌ Erro na requisição proxy:', response.status, response.statusText);
      return Response.json(
        { 
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Dados recebidos via proxy');
    
    return Response.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('❌ Erro no proxy:', error);
    return Response.json(
      { error: `Erro no proxy: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
