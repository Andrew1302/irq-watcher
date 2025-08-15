'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './MemoryChart.module.css';

// Registrar componentes do Chart.js necessários para Line charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MemoryChart = ({ data }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [memoryHistory, setMemoryHistory] = useState([]); // Histórico dos dados de memória

  // Função para converter KB para GB
  const kbToGb = (kb) => kb / 1024 / 1024;

  // Função para calcular porcentagem de uso
  const calculateUsagePercent = (total, used) => (used / total) * 100;

  // Resetar dados
  const resetData = useCallback(() => {
    setMemoryHistory([]);
  }, []);

  // Efeito para coletar dados de memória sempre que a API atualizar (se estiver habilitado)
  useEffect(() => {
    if (!isEnabled || !data?.memoria) return;

    setMemoryHistory(prev => {
      const newHistory = [...prev];
      
      // Limitar a 300 pontos
      if (newHistory.length >= 300) {
        newHistory.shift();
      }
      
      // Calcular valores derivados
      const memoria = data.memoria;
      const memUsed = memoria.mem_total_kb - memoria.mem_available_kb;
      const swapUsed = memoria.swap_total_kb - memoria.swap_free_kb;
      
      // Adicionar nova entrada com timestamp
      newHistory.push({
        timestamp: Date.now(),
        memTotal: kbToGb(memoria.mem_total_kb),
        memUsed: kbToGb(memUsed),
        memFree: kbToGb(memoria.mem_free_kb),
        memAvailable: kbToGb(memoria.mem_available_kb),
        swapTotal: kbToGb(memoria.swap_total_kb),
        swapUsed: kbToGb(swapUsed),
        swapFree: kbToGb(memoria.swap_free_kb),
        memUsagePercent: calculateUsagePercent(memoria.mem_total_kb, memUsed),
        swapUsagePercent: calculateUsagePercent(memoria.swap_total_kb, swapUsed)
      });
      
      return newHistory;
    });
  }, [data, isEnabled]);

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (memoryHistory.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Calcular intervalos de tempo baseados nos timestamps
    const timeData = memoryHistory.map((item, index) => {
      if (index === 0) return 0;
      return (item.timestamp - memoryHistory[0].timestamp) / 1000; // Converter para segundos
    });

    // Calcular intervalo médio
    let averageInterval = 0;
    if (memoryHistory.length > 1) {
      const totalTime = (memoryHistory[memoryHistory.length - 1].timestamp - memoryHistory[0].timestamp) / 1000;
      averageInterval = totalTime / (memoryHistory.length - 1);
    }

    return {
      labels: timeData,
      datasets: [
        {
          label: 'Memória Usada (GB)',
          data: memoryHistory.map((item, index) => ({
            x: timeData[index],
            y: item.memUsed
          })),
          borderColor: '#e74c3c',
          backgroundColor: '#e74c3c20',
          tension: 0.1,
          pointRadius: 1,
        },
        {
          label: 'Memória Disponível (GB)',
          data: memoryHistory.map((item, index) => ({
            x: timeData[index],
            y: item.memAvailable
          })),
          borderColor: '#27ae60',
          backgroundColor: '#27ae6020',
          tension: 0.1,
          pointRadius: 1,
        },
        {
          label: 'Memória Livre (GB)',
          data: memoryHistory.map((item, index) => ({
            x: timeData[index],
            y: item.memFree
          })),
          borderColor: '#3498db',
          backgroundColor: '#3498db20',
          tension: 0.1,
          pointRadius: 1,
        },
        {
          label: 'Swap Usado (GB)',
          data: memoryHistory.map((item, index) => ({
            x: timeData[index],
            y: item.swapUsed
          })),
          borderColor: '#f39c12',
          backgroundColor: '#f39c1220',
          tension: 0.1,
          pointRadius: 1,
        }
      ],
      metadata: {
        totalPoints: memoryHistory.length,
        timeSpan: timeData[timeData.length - 1] || 0,
        averageInterval: averageInterval
      }
    };
  }, [memoryHistory]);

  // Opções do gráfico
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Tempo (desde o início)'
        },
        ticks: {
          callback: function(value) {
            if (value < 60) {
              return `${value.toFixed(1)}s`;
            } else {
              const minutes = Math.floor(value / 60);
              const seconds = (value % 60).toFixed(1);
              return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
            }
          },
          stepSize: chartData.metadata?.averageInterval ? Math.max(chartData.metadata.averageInterval, 1) : undefined
        }
      },
      y: {
        title: {
          display: true,
          text: 'Memória (GB)'
        },
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `${value.toFixed(2)} GB`;
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            const timeValue = context[0].parsed.x;
            if (timeValue < 60) {
              return `Tempo: ${timeValue.toFixed(1)}s`;
            } else {
              const minutes = Math.floor(timeValue / 60);
              const seconds = (timeValue % 60).toFixed(1);
              return `Tempo: ${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
            }
          },
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value.toFixed(2)} GB`;
          },
          afterBody: function(context) {
            if (chartData.metadata) {
              return [
                `Taxa média: ${chartData.metadata.averageInterval.toFixed(1)}s/ponto`,
                `Total de pontos: ${chartData.metadata.totalPoints}`,
                `Duração: ${chartData.metadata.timeSpan.toFixed(1)}s`
              ];
            }
            return [];
          }
        }
      }
    }
  }), [chartData]);

  return (
    <div className={styles['memory-container']}>
      <div className={styles['memory-header']}>
        <h3>💾 Gráfico Temporal de Memória</h3>
        <div className={styles['memory-controls']}>
          <label className={styles['memory-toggle']}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            Habilitar Monitoramento de Memória
          </label>
          {isEnabled && (
            <button 
              onClick={resetData}
              className={styles['reset-btn']}
              title={`Reinicia o gráfico de memória do zero. Taxa atual: ${chartData.metadata?.averageInterval ? chartData.metadata.averageInterval.toFixed(1) + 's' : 'calculando...'}`}
            >
              🔄 Reset ({memoryHistory.length} pts, {chartData.metadata?.averageInterval ? chartData.metadata.averageInterval.toFixed(1) + 's' : '?'})
            </button>
          )}
        </div>
      </div>

      {isEnabled && (
        <div className={styles['memory-chart']}>
          {memoryHistory.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className={styles['memory-waiting']}>
              <p>💾 Coletando dados de memória... O primeiro ponto será a referência (t=0).</p>
              <p>📈 Dados coletados: {memoryHistory.length}/300</p>
              {chartData.metadata?.averageInterval && (
                <p>⏱️ Taxa atual da API: {chartData.metadata.averageInterval.toFixed(1)}s por requisição</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoryChart;
