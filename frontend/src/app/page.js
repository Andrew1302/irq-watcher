'use client';

import { useState } from 'react';
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
  const [useRealApi, setUseRealApi] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api/interrupts');
  
  // Usar apenas dados de exemplo por enquanto para eliminar problemas
  const data = sampleData;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>IRQ Watcher - Monitor de Interrupções</h1>
        <p>Ferramenta educativa para visualizar interrupções do processador</p>
      </header>

      <div className={styles['api-controls']}>
        <div className={styles['control-group']}>
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
              <div className={styles['url-input']}>
                <label>URL da API:</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8000/api/interrupts"
                />
              </div>
              
              <div className={styles['api-status']}>
                <span className={`${styles.status} ${styles.success}`}>✅ Configurado (modo demo)</span>
              </div>
            </>
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
