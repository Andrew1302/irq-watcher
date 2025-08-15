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

const MemoryChart = dynamic(() => import('./MemoryChart'), { 
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
      <p style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '500' }}>💾 Carregando gráfico de memória...</p>
    </div>
  )
});

// Função para formatação consistente de números (evita problemas de hidratação)
const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Função para converter KB para GB
const kbToGb = (kb) => {
  if (typeof kb !== 'number') return 0;
  return (kb / 1024 / 1024);
};

// Função para formatear tamanho de memória
const formatMemorySize = (kb) => {
  const gb = kbToGb(kb);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  } else {
    const mb = kb / 1024;
    return `${mb.toFixed(0)} MB`;
  }
};

// Descrições das métricas de memória
const memoriaDescricoes = {
  'total': 'Quantidade total de memória RAM física instalada no sistema',
  'disponivel': 'Memória utilizável por novas aplicações, incluindo RAM livre e cache liberável pelo kernel',
  'livre': 'Memória completamente não utilizada, sem dados ou cache. Porção da RAM que está completamente vazia',
  'uso': 'Percentual efetivo de uso: (Total - Disponível) / Total. Indica memória ativamente utilizada não liberável'
};

// Descrições das métricas de swap
const swapDescricoes = {
  'total': 'Tamanho total do espaço de swap (arquivo de paginação ou partição de swap)',
  'usado': 'Quantidade de swap em uso. Valores altos indicam pouca RAM disponível',
  'livre': 'Espaço de swap disponível. Usado quando RAM está cheia, movendo dados menos usados para disco',
  'uso': 'Percentual do swap em uso. Valores altos podem indicar necessidade de mais RAM'
};

// Descrições das categorias de interrupção
const categoriaDescricoes = {
  'rede': 'Comunicação e transferência de dados através de conexões de rede local, Wi-Fi, internet e outros protocolos de comunicação entre dispositivos',
  'armazenamento': 'Operações de leitura e escrita de dados em discos rígidos, SSDs, pendrives e outros dispositivos de armazenamento de dados',
  'usb': 'Gerenciamento e comunicação com dispositivos conectados através de portas USB, incluindo transferência de dados e fornecimento de energia',
  'entrada': 'Captura de comandos e interações do usuário através de teclados, mouses, touchpads, joysticks e outros dispositivos de entrada',
  'gpu': 'Processamento gráfico, renderização de imagens, aceleração de vídeo e cálculos paralelos realizados pela placa de vídeo',
  'audio': 'Processamento de som, reprodução e gravação de áudio, controle de volume e comunicação com dispositivos sonoros',
  'energia': 'Gerenciamento de consumo energético, controle térmico, ajuste de frequências do processador e otimização da bateria',
  'temporizador': 'Sincronização temporal do sistema, agendamento de tarefas, controle de relógio e eventos baseados em tempo',
  'inter-cpu': 'Comunicação e coordenação entre múltiplos núcleos do processador para distribuição de tarefas e sincronização',
  'kernel': 'Operações internas críticas do sistema operacional, tratamento de erros, monitoramento de desempenho e funções essenciais',
  'pcie': 'Comunicação com dispositivos conectados via PCIe, incluindo placas de expansão, dispositivos Thunderbolt e componentes de alta velocidade',
  'virtualizacao': 'Suporte a máquinas virtuais, containers e ambientes virtualizados, facilitando a execução de múltiplos sistemas',
  'gpio': 'Controle de pinos de entrada/saída de uso geral, sensores, LEDs e outros dispositivos eletrônicos de baixo nível',
  'sistema': 'Operações fundamentais do sistema operacional e interrupções que não se enquadram em categorias específicas'
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

      <MemoryChart data={data} />

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
        {data.memoria && (
          <>
            <div className={styles['stat-item']}>
              <h4>Memória RAM</h4>
              <p className={styles['memory-total']}>
                Total: {formatMemorySize(data.memoria.mem_total_kb)}
                <span 
                  className={styles['tooltip-icon']}
                  title={memoriaDescricoes['total']}
                >
                  ?
                </span>
              </p>
              <p className={styles['memory-available']}>
                Disponível: {formatMemorySize(data.memoria.mem_available_kb)}
                <span 
                  className={styles['tooltip-icon']}
                  title={memoriaDescricoes['disponivel']}
                >
                  ?
                </span>
              </p>
              <p className={styles['memory-free']}>
                Livre: {formatMemorySize(data.memoria.mem_free_kb)}
                <span 
                  className={styles['tooltip-icon']}
                  title={memoriaDescricoes['livre']}
                >
                  ?
                </span>
              </p>
              <p className={styles['memory-usage-percent']}>
                Uso: {(((data.memoria.mem_total_kb - data.memoria.mem_available_kb) / data.memoria.mem_total_kb) * 100).toFixed(1)}%
                <span 
                  className={styles['tooltip-icon']}
                  title={memoriaDescricoes['uso']}
                >
                  ?
                </span>
              </p>
            </div>
            <div className={styles['stat-item']}>
              <h4>Memória Swap</h4>
              <p className={styles['swap-total']}>
                Total: {formatMemorySize(data.memoria.swap_total_kb)}
                <span 
                  className={styles['tooltip-icon']}
                  title={swapDescricoes['total']}
                >
                  ?
                </span>
              </p>
              <p className={styles['swap-used']}>
                Usado: {formatMemorySize(data.memoria.swap_total_kb - data.memoria.swap_free_kb)}
                <span 
                  className={styles['tooltip-icon']}
                  title={swapDescricoes['usado']}
                >
                  ?
                </span>
              </p>
              <p className={styles['swap-free']}>
                Livre: {formatMemorySize(data.memoria.swap_free_kb)}
                <span 
                  className={styles['tooltip-icon']}
                  title={swapDescricoes['livre']}
                >
                  ?
                </span>
              </p>
              <p className={styles['swap-usage-percent']}>
                Uso: {data.memoria.swap_total_kb > 0 ? (((data.memoria.swap_total_kb - data.memoria.swap_free_kb) / data.memoria.swap_total_kb) * 100).toFixed(1) : 0}%
                <span 
                  className={styles['tooltip-icon']}
                  title={swapDescricoes['uso']}
                >
                  ?
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
