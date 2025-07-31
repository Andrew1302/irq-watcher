'use client';

import { useState, useEffect } from 'react';
import InterruptChart from '../components/InterruptChart';
import { useInterruptData } from '../hooks/useInterruptData';
import styles from './page.module.css';

// Dados de exemplo para teste (remover quando a API estiver funcionando)
const sampleData = {
  "interrupcoes_tempo": {
    "interrupcoes": 0,
    "util": 0.06115107913669065,
    "ocioso": 0.9388489208633094
  },
  "por_cpu": {
    "0": 2319885,
    "1": 1333367,
    "2": 2297574,
    "3": 1041267,
    "4": 1438319,
    "5": 1020414,
    "6": 1378914,
    "7": 1129653,
    "8": 2053875,
    "9": 1897122,
    "10": 1516714,
    "11": 1101574,
    "12": 1451179,
    "13": 1061228,
    "14": 1408691
  },
  "por_categoria": {
    "armazenamento": {
      "0": 78568,
      "1": 4737,
      "2": 391709,
      "3": 2563,
      "4": 2192,
      "5": 1501,
      "6": 3328,
      "7": 3298,
      "8": 1702,
      "9": 3346,
      "10": 3834,
      "11": 2840,
      "12": 3912,
      "13": 2181,
      "14": 3979
    },
    "energia": {
      "0": 0,
      "1": 163,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    },
    "entrada": {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 6513
    },
    "gpu": {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 758591,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    },
    "outras": {
      "0": 0,
      "1": 0,
      "2": 413665,
      "3": 0,
      "4": 1,
      "5": 0,
      "6": 259,
      "7": 59141,
      "8": 498126,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    },
    "rede": {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    },
    "sistema": {
      "0": 2241173,
      "1": 1328467,
      "2": 1492200,
      "3": 1038530,
      "4": 1436126,
      "5": 1018913,
      "6": 1375327,
      "7": 1067214,
      "8": 1554047,
      "9": 1135185,
      "10": 1512880,
      "11": 1098734,
      "12": 1447267,
      "13": 1059047,
      "14": 1398199
    },
    "temporizador": {
      "0": 144,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    },
    "usb": {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 174,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    }
  },
  "trocas_de_contexto": 29878510
};

export default function Home() {
  const [useRealApi, setUseRealApi] = useState(true); // ✅ Habilitado por padrão
  const [apiUrl, setApiUrl] = useState('https://rxk68src-8080.brs.devtunnels.ms/metrics');
  const [data, setData] = useState(sampleData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Configurações de atualização automática
  const [autoRefresh, setAutoRefresh] = useState(true); // ✅ Habilitado por padrão
  const [refreshInterval, setRefreshInterval] = useState(1); // ✅ 1 segundo por padrão
  
  // Estado para controlar visibilidade da configuração da API
  const [showApiConfig, setShowApiConfig] = useState(true); // ✅ Aberto por padrão
  const [useProxy, setUseProxy] = useState(true); // ✅ Habilitado por padrão
  
  // Função para validar e normalizar URL
  const normalizeUrl = (url) => {
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida');
    }

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('URL não pode estar vazia');
    }

    // Remover múltiplas barras finais
    cleanUrl = cleanUrl.replace(/\/+$/, '');

    // Se já é uma URL completa e válida, apenas validar
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      try {
        new URL(cleanUrl);
        return cleanUrl;
      } catch (e) {
        throw new Error(`URL inválida: ${cleanUrl}`);
      }
    }

    // Se não tem protocolo, adicionar baseado no contexto
    if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
      cleanUrl = 'http://' + cleanUrl;
    } else if (cleanUrl.match(/^\d+\.\d+\.\d+\.\d+/)) {
      // IP address
      cleanUrl = 'http://' + cleanUrl;
    } else if (cleanUrl.includes('.')) {
      // Domain name - usar https por padrão
      cleanUrl = 'https://' + cleanUrl;
    } else {
      // Caso genérico - usar http
      cleanUrl = 'http://' + cleanUrl;
    }

    // Validar formato final da URL
    try {
      new URL(cleanUrl);
      return cleanUrl;
    } catch (e) {
      throw new Error(`URL inválida: ${cleanUrl}`);
    }
  };

  // Função para buscar dados da API
  const fetchApiData = async () => {
    if (!useRealApi) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Normalizar e validar a URL
      console.log('🔧 Antes da normalização:', { apiUrl });
      const fullUrl = normalizeUrl(apiUrl);
      console.log('🔧 Depois da normalização:', { fullUrl });
      
      console.log('🌐 Configuração da requisição:');
      console.log('  - URL original:', apiUrl);
      console.log('  - URL final:', fullUrl);
      console.log('  - Usando proxy:', useProxy);
      
      let response;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        // Tentar requisição direta primeiro
        if (useProxy) {
          // Usar proxy interno
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
          console.log('📡 Fazendo requisição via proxy:', proxyUrl);
          response = await fetch(proxyUrl, {
            method: 'GET',
            signal: controller.signal,
          });
        } else {
          // Requisição direta
          console.log('📡 Fazendo requisição direta:', fullUrl);
          response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            },
            signal: controller.signal,
            mode: 'cors',
          });
        }
      } catch (directError) {
        clearTimeout(timeoutId);
        
        // Se falhou e não estava usando proxy, tentar com proxy
        if (!useProxy && (directError.name === 'TypeError' || directError.message.includes('CORS'))) {
          console.log('⚠️ Requisição direta falhou, tentando com proxy...');
          setUseProxy(true);
          
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
          console.log('📡 Fazendo requisição via proxy:', proxyUrl);
          
          const newController = new AbortController();
          const newTimeoutId = setTimeout(() => newController.abort(), 15000);
          
          response = await fetch(proxyUrl, {
            method: 'GET',
            signal: newController.signal,
          });
          
          clearTimeout(newTimeoutId);
        } else {
          throw directError;
        }
      }
      
      clearTimeout(timeoutId);
      
      console.log('📡 Resposta da API:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage += `\n\n🔍 Endpoint não encontrado. Verifique se:\n• A API está rodando\n• A URL ${fullUrl} está correta\n• O endpoint existe`;
        } else if (response.status === 500) {
          errorMessage += '\n\n⚠️ Erro interno do servidor. Verifique os logs da API.';
        } else if (response.status === 403) {
          errorMessage += '\n\n🚫 Acesso negado. Verifique as permissões da API.';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage += '\n\n❌ Erro na requisição. Verifique a URL e parâmetros.';
        }
        
        throw new Error(errorMessage);
      }
      
      // Tentar ler a resposta como JSON
      let apiData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        apiData = await response.json();
      } else {
        const textData = await response.text();
        console.log('📄 Resposta não é JSON:', textData);
        throw new Error(`Resposta não é JSON válido. Content-Type: ${contentType}\nResposta: ${textData.substring(0, 200)}...`);
      }
      
      console.log('✅ Dados recebidos:', apiData);
      
      // Validar estrutura básica dos dados
      if (!apiData || typeof apiData !== 'object') {
        throw new Error('Dados recebidos não são um objeto válido');
      }
      
      // Verificar se tem pelo menos uma das estruturas esperadas
      const hasExpectedStructure = 
        apiData.por_cpu || 
        apiData.por_categoria || 
        apiData.interrupcoes_tempo ||
        apiData.trocas_de_contexto;
      
      if (!hasExpectedStructure) {
        console.warn('⚠️ Estrutura de dados não reconhecida:', Object.keys(apiData));
        // Mesmo assim, vamos tentar usar os dados
      }
      
      setData(apiData);
      setLastUpdate(new Date());
      console.log('🎉 Dados carregados com sucesso!');
      
    } catch (err) {
      let userFriendlyError;
      
      if (err.name === 'AbortError') {
        userFriendlyError = '⏱️ Timeout: A API não respondeu em 15 segundos';
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        userFriendlyError = `🌐 Erro de conexão: Não foi possível conectar com ${apiUrl}\n\nVerifique se:\n• A API está rodando\n• A URL está correta\n• Não há firewall bloqueando\n\n${useProxy ? '(Tentativa com proxy também falhou)' : '(Tentando usar proxy automaticamente...)'}`;
      } else if (err.message.includes('URL inválida')) {
        userFriendlyError = `🔗 ${err.message}\n\nExemplos válidos:\n• http://localhost:8000/metrics\n• https://api.exemplo.com/metrics\n• 192.168.1.100:8000/metrics`;
      } else {
        userFriendlyError = err.message;
      }
      
      setError(userFriendlyError);
      console.error('❌ Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Effect para atualização automática
  useEffect(() => {
    let intervalId;
    
    if (useRealApi && autoRefresh && refreshInterval > 0) {
      // Buscar dados imediatamente
      fetchApiData();
      
      // Configurar intervalo de atualização
      intervalId = setInterval(fetchApiData, refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [useRealApi, autoRefresh, refreshInterval, apiUrl]);
  
  // Buscar dados quando ativar API real pela primeira vez
  useEffect(() => {
    if (useRealApi && !autoRefresh) {
      fetchApiData();
    } else if (!useRealApi) {
      setData(sampleData);
      setError(null);
      setLastUpdate(null);
    }
  }, [useRealApi]);

  // Buscar dados inicialmente se a API real estiver habilitada
  useEffect(() => {
    if (useRealApi) {
      fetchApiData();
    }
  }, []); // Executar apenas uma vez na inicialização
  
  // Função para testar conectividade da API
  const testApiConnection = async () => {
    try {
      const fullUrl = normalizeUrl(apiUrl);
      console.log('🧪 Testando conectividade com:', fullUrl);
      console.log('🧪 Usando proxy:', useProxy);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      let response;
      
      if (useProxy) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
        response = await fetch(proxyUrl, {
          method: 'GET',
          signal: controller.signal,
        });
      } else {
        response = await fetch(fullUrl, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors',
        });
      }
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        alert(`✅ Conectividade OK!\nServidor respondeu com status ${response.status}\n${useProxy ? '(via proxy)' : '(conexão direta)'}`);
      } else {
        alert(`⚠️ Servidor acessível mas retornou status ${response.status}\nURL testada: ${fullUrl}\n${useProxy ? '(via proxy)' : '(conexão direta)'}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        alert('⏱️ Timeout: Servidor não respondeu em 5 segundos');
      } else {
        alert(`❌ Erro de conectividade:\n${err.message}\n\n💡 Dica: Tente habilitar "Usar Proxy" se estiver tendo problemas de CORS`);
      }
    }
  };

  // Função para atualização manual
  const handleManualRefresh = () => {
    fetchApiData();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>IRQ Watcher - Monitor de Interrupções</h1>
        <p>Ferramenta educativa para visualizar interrupções do processador</p>
      </header>

      <div className={styles['api-controls']}>
        <div className={styles['control-group']}>
          <button 
            type="button"
            onClick={() => setShowApiConfig(!showApiConfig)}
            className={styles['main-config-toggle']}
          >
            {showApiConfig ? '🔼 Ocultar Configuração da API' : '⚙️ Mostrar Configuração da API'}
          </button>
          
          {showApiConfig && (
            <div className={styles['api-config']}>
              <div className={styles['api-toggle']}>
                <label>
                  <input
                    type="checkbox"
                    checked={useRealApi}
                    onChange={(e) => setUseRealApi(e.target.checked)}
                  />
                  Usar API Real
                </label>
              </div>
              
              {useRealApi && (
                <>
                  <div className={styles['url-input']}>
                    <label>URL Completa da API:</label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="Ex: https://rxk68src-8080.brs.devtunnels.ms/metrics"
                      className={error ? styles['input-error'] : ''}
                    />
                    <button 
                      type="button" 
                      onClick={testApiConnection}
                      className={styles['test-btn']}
                      disabled={!apiUrl.trim()}
                    >
                      🔍 Testar Conexão
                    </button>
                  </div>
              
              <div className={styles['refresh-controls']}>
                <label>
                  <input
                    type="checkbox"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                  />
                  Usar Proxy (para contornar CORS)
                </label>
                
                <label>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Atualização Automática
                </label>
                
                {autoRefresh && (
                  <div className={styles['interval-input']}>
                    <label>Intervalo:</label>
                    <select 
                      value={refreshInterval} 
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    >
                      <option value={1}>1 segundo</option>
                      <option value={2}>2 segundos</option>
                      <option value={5}>5 segundos</option>
                      <option value={10}>10 segundos</option>
                      <option value={30}>30 segundos</option>
                      <option value={60}>1 minuto</option>
                    </select>
                  </div>
                )}
                
                {!autoRefresh && (
                  <button 
                    onClick={handleManualRefresh} 
                    disabled={loading}
                    className={styles['manual-refresh']}
                  >
                    {loading ? '🔄 Carregando...' : '🔄 Atualizar Agora'}
                  </button>
                )}
              </div>
              
              <div className={styles['api-status']}>
                {loading && (
                  <span className={`${styles.status} ${styles.loading}`}>
                    🔄 Carregando dados...
                  </span>
                )}
                {error && (
                  <span className={`${styles.status} ${styles.error}`}>
                    ❌ Erro: {error}
                  </span>
                )}
                {!loading && !error && lastUpdate && (
                  <span className={`${styles.status} ${styles.success}`}>
                    ✅ Última atualização: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!useRealApi && (
        <div className={styles['demo-notice']}>
          📊 Mostrando dados de exemplo para demonstração. 
          Habilite "Usar API Real" para conectar com sua API.
        </div>
      )}

      <InterruptChart data={data} />

      <footer className={styles.footer}>
        <p>
          💡 <strong>Como usar:</strong><br/>
          • Selecione os núcleos e tipos de interrupção que deseja visualizar<br/>
          • Escolha o modo de visualização (por núcleos, categorias ou detalhado)<br/>
          • Use os filtros para focar em dados específicos<br/>
          • Os gráficos são interativos - passe o mouse para ver detalhes
        </p>
      </footer>
    </div>
  );
}
