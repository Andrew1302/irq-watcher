'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
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
import styles from './TemporalChart.module.css';

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

const TemporalChart = ({ data, selectedCores, selectedCategories, viewMode }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [allDataHistory, setAllDataHistory] = useState([]); // Histórico completo das 300 últimas requisições
  const [baselineValues, setBaselineValues] = useState(null);

  // Verificar se há filtros selecionados E se é um modo suportado
  const hasValidFilters = useMemo(() => {
    if (viewMode === 'detalhado') return false;
    if (viewMode === 'cores') return selectedCores.length > 0;
    if (viewMode === 'categorias') return selectedCategories.length > 0;
    return false;
  }, [selectedCores, selectedCategories, viewMode]);

  // Resetar apenas quando botão for apertado
  const resetData = useCallback(() => {
    setAllDataHistory([]);
    setBaselineValues(null);
  }, []);

  // Efeito para coletar dados sempre que a API atualizar (se estiver habilitado)
  useEffect(() => {
    if (!isEnabled || !hasValidFilters || !data) return;

    setAllDataHistory(prev => {
      const newHistory = [...prev];
      
      // Limitar a 300 requisições
      if (newHistory.length >= 300) {
        newHistory.shift();
      }
      
      // Adicionar nova entrada com timestamp
      newHistory.push({
        timestamp: Date.now(),
        data: data
      });
      
      return newHistory;
    });
  }, [data, isEnabled, hasValidFilters]);

  // Calcular dados do gráfico baseado no histórico e filtros atuais
  const chartData = useMemo(() => {
    if (!isEnabled || !hasValidFilters || allDataHistory.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Calcular intervalo médio entre requisições para melhorar precisão
    let averageInterval = 2; // Fallback de 2 segundos
    if (allDataHistory.length > 1) {
      const intervals = [];
      for (let i = 1; i < allDataHistory.length; i++) {
        const interval = (allDataHistory[i].timestamp - allDataHistory[i-1].timestamp) / 1000;
        intervals.push(interval);
      }
      averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    // Obter timestamp inicial para calcular tempo relativo
    const startTime = allDataHistory[0].timestamp;

    // Calcular dados para cada ponto no histórico usando timestamps reais
    const processedData = allDataHistory.map((historyItem, index) => {
      const currentData = historyItem.data;
      let currentValues = {};
      
      if (viewMode === 'cores') {
        selectedCores.forEach(core => {
          if (currentData?.por_cpu?.[core]) {
            currentValues[`Núcleo ${core}`] = currentData.por_cpu[core];
          }
        });
      } else if (viewMode === 'categorias') {
        selectedCategories.forEach(category => {
          if (currentData?.por_categoria?.[category]) {
            const total = Object.values(currentData.por_categoria[category]).reduce((sum, val) => sum + (val || 0), 0);
            currentValues[category.charAt(0).toUpperCase() + category.slice(1)] = total;
          }
        });
      }

      // Usar tempo real baseado nos timestamps da API
      const actualTimeInSeconds = (historyItem.timestamp - startTime) / 1000;

      return {
        time: Math.round(actualTimeInSeconds * 10) / 10, // Arredondar para 1 casa decimal
        values: currentValues,
        intervalFromPrevious: index > 0 ? (historyItem.timestamp - allDataHistory[index-1].timestamp) / 1000 : 0
      };
    });

    // Definir baseline do primeiro ponto se não existir
    if (!baselineValues && processedData.length > 0) {
      setBaselineValues(processedData[0].values);
    }

    // Calcular valores relativos ao baseline
    const relativeData = processedData.map(item => {
      if (!baselineValues) return item;
      
      const relativeValues = {};
      Object.keys(item.values).forEach(key => {
        const current = item.values[key] || 0;
        const baseline = baselineValues[key] || 0;
        relativeValues[key] = Math.max(0, current - baseline);
      });
      
      return {
        time: item.time,
        values: relativeValues,
        intervalFromPrevious: item.intervalFromPrevious
      };
    });

    // Extrair todas as séries
    const allSeries = new Set();
    relativeData.forEach(item => {
      Object.keys(item.values).forEach(key => allSeries.add(key));
    });

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#ec4899', '#8b5a2b', '#059669', '#dc2626'];
    
    const datasets = Array.from(allSeries).map((seriesName, index) => ({
      label: seriesName,
      data: relativeData.map(item => ({
        x: item.time, // Tempo real baseado nos timestamps
        y: item.values[seriesName] || 0
      })),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.1,
      pointRadius: 1,
      borderWidth: 2,
      fill: false
    }));

    return {
      datasets: datasets,
      metadata: {
        averageInterval: averageInterval,
        totalPoints: allDataHistory.length,
        timeSpan: relativeData.length > 0 ? relativeData[relativeData.length - 1].time : 0
      }
    };
  }, [allDataHistory, baselineValues, selectedCores, selectedCategories, viewMode, isEnabled, hasValidFilters]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: `Tempo (segundos desde o início) - Taxa: ${chartData.metadata?.averageInterval ? chartData.metadata.averageInterval.toFixed(1) + 's' : 'calculando...'}`
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
          // Ajustar densidade dos ticks baseado na taxa da API
          stepSize: chartData.metadata?.averageInterval ? Math.max(chartData.metadata.averageInterval, 1) : undefined
        }
      },
      y: {
        title: {
          display: true,
          text: 'Interrupções (incremento desde t=0)'
        },
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value.toString();
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
            const formattedValue = value >= 1000 ? 
              value.toLocaleString() : 
              value.toString();
            return `${context.dataset.label}: +${formattedValue} interrupções`;
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
    <div className={styles['temporal-container']}>
      <div className={styles['temporal-header']}>
        <h3>📈 Gráfico Temporal de Interrupções</h3>
        <div className={styles['temporal-controls']}>
          {viewMode === 'detalhado' ? (
            <p className={styles['temporal-warning']}>
              ⚠️ O gráfico temporal não está disponível no modo detalhado. Use o modo "Por Núcleos" ou "Por Categorias".
            </p>
          ) : !hasValidFilters ? (
            <p className={styles['temporal-warning']}>
              ⚠️ Selecione pelo menos um núcleo ou categoria nos filtros acima para habilitar o gráfico temporal.
            </p>
          ) : (
            <>
              <label className={styles['temporal-toggle']}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
                Habilitar Monitoramento Temporal
              </label>
              {isEnabled && (
                <button 
                  onClick={resetData}
                  className={styles['reset-btn']}
                  title={`Reinicia o gráfico temporal do zero. Taxa atual: ${chartData.metadata?.averageInterval ? chartData.metadata.averageInterval.toFixed(1) + 's' : 'calculando...'}`}
                >
                  🔄 Reset ({allDataHistory.length} pts, {chartData.metadata?.averageInterval ? chartData.metadata.averageInterval.toFixed(1) + 's' : '?'})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isEnabled && hasValidFilters && (
        <div className={styles['temporal-chart']}>
          {allDataHistory.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className={styles['temporal-waiting']}>
              <p>📊 Coletando dados... O primeiro ponto será a referência (t=0).</p>
              <p>📈 Dados coletados: {allDataHistory.length}/300</p>
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

export default TemporalChart;
