'use client';

import { useState } from 'react';
import InterruptChart from '../components/InterruptChart';
import { useInterruptData } from '../hooks/useInterruptData';

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
    "kernel": {
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
    },
    "audio": {
      "0": 125,
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
    "inter-cpu": {
      "0": 5438,
      "1": 4892,
      "2": 5123,
      "3": 4765,
      "4": 5001,
      "5": 4821,
      "6": 5234,
      "7": 4967,
      "8": 5112,
      "9": 4998,
      "10": 5076,
      "11": 4834,
      "12": 5198,
      "13": 4901,
      "14": 5087
    },
    "pcie": {
      "0": 42,
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
    }
  },
  "trocas_de_contexto": 29878510,
  "memoria": {
    "mem_total_kb": 16322392,
    "mem_free_kb": 1050000,
    "mem_available_kb": 8000000,
    "swap_total_kb": 2097148,
    "swap_free_kb": 2097148
  }
};

export default function Home() {
  const [useRealApi, setUseRealApi] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api/interrupts');
  
  // Hook para dados da API (quando habilitado)
  const { data: apiData, loading, error, isAutoRefresh, toggleAutoRefresh, manualRefresh } = useInterruptData(
    useRealApi ? apiUrl : null, 
    5000
  );

  // Usar dados da API ou dados de exemplo
  const data = useRealApi ? apiData : sampleData;

  return (
    <div className="container">
      <header className="header">
        <h1>IRQ Watcher - Monitor de Interrupções</h1>
        <p>Ferramenta educativa para visualizar interrupções do processador</p>
      </header>

      <div className="api-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useRealApi}
              onChange={(e) => setUseRealApi(e.target.checked)}
            />
            Usar API Real
          </label>
          
          {useRealApi && (
            <>
              <div className="url-input">
                <label>URL da API:</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8000/api/interrupts"
                />
              </div>
              
              <div className="api-status">
                {loading && <span className="status loading">🔄 Carregando...</span>}
                {error && <span className="status error">❌ Erro: {error}</span>}
                {!loading && !error && <span className="status success">✅ Conectado</span>}
              </div>
              
              <div className="refresh-controls">
                <button onClick={manualRefresh} disabled={loading}>
                  🔄 Atualizar Agora
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={isAutoRefresh}
                    onChange={toggleAutoRefresh}
                  />
                  Auto-atualizar (5s)
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {!useRealApi && (
        <div className="demo-notice">
          📊 Mostrando dados de exemplo para demonstração. 
          Habilite "Usar API Real" para conectar com sua API.
        </div>
      )}

      <InterruptChart data={data} />

      <footer className="footer">
        <p>
          💡 <strong>Como usar:</strong><br/>
          • Selecione os cores e tipos de interrupção que deseja visualizar<br/>
          • Escolha o modo de visualização (por cores, categorias ou detalhado)<br/>
          • Use os filtros para focar em dados específicos<br/>
          • Os gráficos são interativos - passe o mouse para ver detalhes
        </p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: bold;
        }

        .header p {
          margin: 0;
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .api-controls {
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .control-group {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .control-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .url-input {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .url-input input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 300px;
        }

        .api-status {
          display: flex;
          align-items: center;
        }

        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .status.loading {
          background: #fff3cd;
          color: #856404;
        }

        .status.error {
          background: #f8d7da;
          color: #721c24;
        }

        .status.success {
          background: #d4edda;
          color: #155724;
        }

        .refresh-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .refresh-controls button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .refresh-controls button:hover:not(:disabled) {
          background: #0056b3;
        }

        .refresh-controls button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .demo-notice {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          color: #004085;
          padding: 15px;
          margin: 20px;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
        }

        .footer {
          background: #343a40;
          color: white;
          padding: 30px 20px;
          text-align: center;
          margin-top: 50px;
        }

        .footer p {
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }
          
          .control-group {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .url-input {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }
          
          .url-input input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
