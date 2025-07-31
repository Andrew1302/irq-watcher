'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import styles from './InterruptChart.module.css';

// Importação dinâmica dos componentes de gráfico
const ChartRenderer = dynamic(() => import('./ChartRenderer'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '400px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f8f9fa', 
      border: '1px dashed #dee2e6', 
      borderRadius: '4px' 
    }}>
      <p style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '500' }}>📊 Carregando gráfico...</p>
    </div>
  )
});

const TemporalChart = dynamic(() => import('./TemporalChart'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '200px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f8f9fa', 
      border: '1px dashed #dee2e6', 
      borderRadius: '4px' 
    }}>
      <p style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '500' }}>📈 Carregando gráfico temporal...</p>
    </div>
  )
});

// Função para formatação consistente de números (evita problemas de hidratação)
const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Descrições das categorias de interrupção
const categoriaDescricoes = {
  'armazenamento': 'Interrupções relacionadas a dispositivos de armazenamento como discos rígidos, SSDs e controladores SATA/NVMe',
  'energia': 'Interrupções do sistema de gerenciamento de energia, incluindo eventos de ACPI e controle de energia do processador',
  'entrada': 'Interrupções de dispositivos de entrada como teclado, mouse e outros dispositivos HID (Human Interface Device)',
  'gpu': 'Interrupções da placa de vídeo e processamento gráfico, incluindo operações de renderização e cálculos GPU',
  'outras': 'Interrupções diversas que não se enquadram nas outras categorias específicas do sistema',
  'rede': 'Interrupções relacionadas à comunicação de rede, incluindo placas Ethernet, Wi-Fi e outros adaptadores de rede',
  'sistema': 'Interrupções críticas do sistema operacional, incluindo timer do sistema, scheduler e operações do kernel',
  'temporizador': 'Interrupções de timer e eventos de temporização para sincronização e agendamento de tarefas',
  'usb': 'Interrupções de dispositivos USB conectados ao sistema, incluindo controladores USB e dispositivos periféricos'
};

export default function InterruptChart({ data }) {
  const [selectedCores, setSelectedCores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [viewMode, setViewMode] = useState('cores'); // 'cores' ou 'categorias'
  
  // Não inicializar automaticamente - começar sempre vazio
  // useEffect removido para começar com seleções vazias

  // Limpar seleções e começar vazio quando o modo de visualização mudar
  useEffect(() => {
    setSelectedCores([]);
    setSelectedCategories([]);
  }, [viewMode]);

  // Limpar seleções inválidas quando os dados mudam
  useEffect(() => {
    if (!data) return;
    
    // Limpar núcleos que não existem nos dados
    if (data.por_cpu) {
      const availableCores = Object.keys(data.por_cpu);
      setSelectedCores(prev => prev.filter(core => availableCores.includes(core)));
    }
    
    // Limpar categorias que não existem nos dados
    if (data.por_categoria) {
      const availableCategories = Object.keys(data.por_categoria);
      setSelectedCategories(prev => prev.filter(categoria => availableCategories.includes(categoria)));
    }
  }, [data]);

  // Processar dados para o gráfico por cores
  const chartDataByCores = useMemo(() => {
    if (!data || !data.por_cpu || selectedCores.length === 0) return [];
    
    return selectedCores.map(core => ({
      name: `Núcleo ${core}`,
      core: core,
      interrupcoes: data.por_cpu[core] || 0
    }));
  }, [data, selectedCores]);

  // Processar dados para o gráfico por categorias
  const chartDataByCategories = useMemo(() => {
    if (!data || !data.por_categoria || selectedCategories.length === 0) return [];
    
    // No modo categorias, usar todos os cores se nenhum estiver selecionado
    const coresToUse = viewMode === 'categorias' && selectedCores.length === 0 
      ? Object.keys(data.por_cpu || {})
      : selectedCores;
    
    if (coresToUse.length === 0) return [];
    
    return selectedCategories
      .filter(categoria => data.por_categoria[categoria]) // Filtrar categorias que existem nos dados
      .map(categoria => {
        const categoriaData = data.por_categoria[categoria];
        const total = coresToUse.reduce((sum, core) => {
          return sum + (categoriaData[core] || 0);
        }, 0);
        
        return {
          name: categoria.charAt(0).toUpperCase() + categoria.slice(1),
          categoria: categoria,
          interrupcoes: total
        };
      });
  }, [data, selectedCategories, selectedCores, viewMode]);

  // Processar dados para gráfico detalhado (categoria por core)
  const chartDataDetailed = useMemo(() => {
    if (!data || !data.por_categoria || selectedCategories.length === 0) return [];
    
    // No modo detalhado, exigir que pelo menos um core esteja selecionado
    if (selectedCores.length === 0) return [];
    
    return selectedCores.map(core => {
      const coreData = { name: `Núcleo ${core}`, core: core };
      
      selectedCategories.forEach(categoria => {
        // Verificar se a categoria existe nos dados antes de acessar
        if (data.por_categoria[categoria]) {
          coreData[categoria] = data.por_categoria[categoria][core] || 0;
        } else {
          coreData[categoria] = 0; // Valor padrão se a categoria não existir
        }
      });
      
      return coreData;
    });
  }, [data, selectedCategories, selectedCores]);

  const handleCoreToggle = (core) => {
    setSelectedCores(prev => 
      prev.includes(core) 
        ? prev.filter(c => c !== core)
        : [...prev, core]
    );
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAllCores = () => {
    if (data && data.por_cpu) {
      const allCores = Object.keys(data.por_cpu);
      // Se todos os cores estão selecionados, desmarca todos; senão, seleciona todos
      if (selectedCores.length === allCores.length && allCores.every(core => selectedCores.includes(core))) {
        setSelectedCores([]);
      } else {
        setSelectedCores(allCores);
      }
    }
  };

  const selectAllCategories = () => {
    if (data && data.por_categoria) {
      const allCategories = Object.keys(data.por_categoria);
      // Se todas as categorias estão selecionadas, desmarca todas; senão, seleciona todas
      if (selectedCategories.length === allCategories.length && allCategories.every(cat => selectedCategories.includes(cat))) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories(allCategories);
      }
    }
  };

  if (!data) {
    return <div className={styles.loading}>Carregando dados das interrupções...</div>;
  }

  const cores = data.por_cpu ? Object.keys(data.por_cpu) : [];
  const categorias = data.por_categoria ? Object.keys(data.por_categoria) : [];

  // Função para determinar o texto do botão de cores
  const getCoreButtonText = () => {
    if (cores.length === 0) return 'Selecionar Todos os Núcleos';
    const allSelected = selectedCores.length === cores.length && cores.every(core => selectedCores.includes(core));
    return allSelected ? 'Desmarcar Todos os Núcleos' : 'Selecionar Todos os Núcleos';
  };

  // Função para determinar o texto do botão de categorias
  const getCategoryButtonText = () => {
    if (categorias.length === 0) return 'Selecionar Todas as Categorias';
    const allSelected = selectedCategories.length === categorias.length && categorias.every(cat => selectedCategories.includes(cat));
    return allSelected ? 'Desmarcar Todas as Categorias' : 'Selecionar Todas as Categorias';
  };

  return (
    <div className={styles['interrupt-chart']}>
      <div className={styles.controls}>
        <div className={styles['view-mode']}>
          <h3>Modo de Visualização</h3>
          <div className={styles['radio-group']}>
            <label>
              <input
                type="radio"
                value="cores"
                checked={viewMode === 'cores'}
                onChange={(e) => setViewMode(e.target.value)}
              />
              Por Núcleos
            </label>
            <label>
              <input
                type="radio"
                value="categorias"
                checked={viewMode === 'categorias'}
                onChange={(e) => setViewMode(e.target.value)}
              />
              Por Categorias
            </label>
            <label>
              <input
                type="radio"
                value="detalhado"
                checked={viewMode === 'detalhado'}
                onChange={(e) => setViewMode(e.target.value)}
              />
              Detalhado (Categoria por Núcleo)
            </label>
          </div>
        </div>

        <div className={styles.filters}>
          {/* Mostrar filtro de cores apenas nos modos que precisam */}
          {(viewMode === 'cores' || viewMode === 'detalhado') && (
            <div className={styles['core-selection']}>
              <h3>Núcleos do Processador</h3>
              <button onClick={selectAllCores} className={styles['select-all']}>
                {getCoreButtonText()}
              </button>
              <div className={styles['checkbox-grid']}>
                {cores.map(core => (
                  <label key={core} className={styles['checkbox-item']}>
                    <input
                      type="checkbox"
                      checked={selectedCores.includes(core)}
                      onChange={() => handleCoreToggle(core)}
                    />
                    Núcleo {core}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Mostrar filtro de categorias apenas nos modos que precisam */}
          {(viewMode === 'categorias' || viewMode === 'detalhado') && (
            <div className={styles['category-selection']}>
              <h3>Tipos de Interrupção</h3>
              <button onClick={selectAllCategories} className={styles['select-all']}>
                {getCategoryButtonText()}
              </button>
              <div className={styles['checkbox-grid']}>
                {categorias.map(categoria => (
                  <label key={categoria} className={styles['checkbox-item']}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(categoria)}
                      onChange={() => handleCategoryToggle(categoria)}
                    />
                    <span className={styles['category-label']}>
                      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                      <span 
                        className={styles['tooltip-icon']}
                        title={categoriaDescricoes[categoria] || 'Descrição não disponível'}
                      >
                        ?
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles['chart-container']}>
        <ChartRenderer 
          viewMode={viewMode}
          chartDataByCores={chartDataByCores}
          chartDataByCategories={chartDataByCategories}
          chartDataDetailed={chartDataDetailed}
          selectedCategories={selectedCategories}
        />
      </div>

      {(viewMode === 'cores' || viewMode === 'categorias') && (
        <TemporalChart 
          data={data}
          selectedCores={selectedCores}
          selectedCategories={selectedCategories}
          viewMode={viewMode}
        />
      )}

      <div className={styles.stats}>
        <div className={styles['stat-item']}>
          <h4>Utilização da CPU</h4>
          <p className={styles['cpu-usage']}>Utilizando: {(data.interrupcoes_tempo?.util * 100 || 0).toFixed(2)}%</p>
          <p className={styles['cpu-idle']}>Ocioso: {(data.interrupcoes_tempo?.ocioso * 100 || 0).toFixed(2)}%</p>
        </div>
        <div className={styles['stat-item']}>
          <h4>Trocas de Contexto</h4>
          <p className={styles['context-switches']}>{formatNumber(data.trocas_de_contexto || 0)}</p>
        </div>
      </div>
    </div>
  );
}
