'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const CATEGORIA_COLORS = {
  'rede': '#ff0080',
  'armazenamento': '#8884d8',
  'usb': '#0080ff',
  'entrada': '#ffc658',
  'gpu': '#ff7300',
  'audio': '#9b59b6',
  'energia': '#82ca9d',
  'temporizador': '#ff8000',
  'inter-cpu': '#e74c3c',
  'kernel': '#8000ff',
  'pcie': '#2ecc71',
  'virtualizacao': '#f39c12',
  'gpio': '#16a085',
  'sistema': '#34495e'
};

const CORES_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
  '#ff0080', '#8000ff', '#ff8000', '#0080ff', '#80ff00',
  '#ff0040', '#4000ff', '#ff4000', '#0040ff', '#40ff00'
];

export default function ChartRenderer({ viewMode, chartDataByCores, chartDataByCategories, chartDataDetailed, selectedCategories }) {
  // Verificar se há dados para exibir
  const hasData = () => {
    if (viewMode === 'cores') return chartDataByCores.length > 0;
    if (viewMode === 'categorias') return chartDataByCategories.length > 0;
    if (viewMode === 'detalhado') return chartDataDetailed.length > 0 && selectedCategories.length > 0;
    return false;
  };

  // Se não há dados, mostrar mensagem
  if (!hasData()) {
    let message = '';
    if (viewMode === 'cores') {
      message = '📊 Selecione pelo menos um núcleo para visualizar o gráfico';
    } else if (viewMode === 'categorias') {
      message = '📊 Selecione pelo menos uma categoria para visualizar o gráfico';
    } else if (viewMode === 'detalhado') {
      message = '📊 Selecione pelo menos um núcleo e uma categoria para visualizar o gráfico detalhado';
    }
    
    return (
      <div style={{ 
        height: '400px', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa', 
        border: '1px dashed #dee2e6', 
        borderRadius: '4px',
        fontSize: '16px',
        color: '#2c3e50',
        fontWeight: '500'
      }}>
        {message}
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: viewMode === 'cores' ? 'Interrupções por Núcleo' : 
              viewMode === 'categorias' ? 'Interrupções por Categoria' : 
              'Interrupções Detalhadas (Categoria por Núcleo)',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatNumber(value);
          }
        }
      }
    },
  };

  // Preparar dados para Chart.js baseado no modo de visualização
  let chartData = {};

  if (viewMode === 'cores') {
    chartData = {
      labels: chartDataByCores.map(item => item.name),
      datasets: [
        {
          label: 'Interrupções',
          data: chartDataByCores.map(item => item.interrupcoes),
          backgroundColor: '#8884d8',
          borderColor: '#8884d8',
          borderWidth: 1,
        },
      ],
    };
  } else if (viewMode === 'categorias') {
    chartData = {
      labels: chartDataByCategories.map(item => item.name),
      datasets: [
        {
          label: 'Interrupções',
          data: chartDataByCategories.map(item => item.interrupcoes),
          backgroundColor: '#82ca9d',
          borderColor: '#82ca9d',
          borderWidth: 1,
        },
      ],
    };
  } else if (viewMode === 'detalhado') {
    chartData = {
      labels: chartDataDetailed.map(item => item.name),
      datasets: selectedCategories.map((categoria, index) => ({
        label: categoria.charAt(0).toUpperCase() + categoria.slice(1),
        data: chartDataDetailed.map(item => item[categoria] || 0),
        backgroundColor: CATEGORIA_COLORS[categoria] || CORES_COLORS[index % CORES_COLORS.length],
        borderColor: CATEGORIA_COLORS[categoria] || CORES_COLORS[index % CORES_COLORS.length],
        borderWidth: 1,
      })),
    };
  }

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
