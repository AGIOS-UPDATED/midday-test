'use client';

import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';

const LLMAccuracyChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const options: ApexOptions = {
        series: [{
          data: [96, 94, 92, 89, 87]
        }],
        chart: {
          type: 'bar',
          height: 250,
          toolbar: {
            show: false
          },
          background: 'transparent'
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: false,
            columnWidth: '45%',
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return val + '%';
          },
          style: {
            fontSize: '12px',
            colors: ['#F1F1F1']
          }
        },
        xaxis: {
          categories: ['GPT-4', 'Claude 2', 'PaLM 2', 'GPT-3.5', 'LLAMA 2'],
          labels: {
            style: {
              colors: '#F1F1F1',
              fontSize: '12px',
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#F1F1F1',
              fontSize: '12px',
            }
          }
        },
        grid: {
          show: true,
          borderColor: 'rgba(241, 241, 241, 0.1)',
          strokeDashArray: 4,
        },
        colors: ['#FFFFFF'],
        title: {
          text: 'LLM Model Accuracy',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 600,
            color: '#F1F1F1'
          }
        },
        theme: {
          mode: 'dark'
        }
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, []);

  return (
    <div className="w-full max-w-[500px] mx-auto mb-8 p-4 rounded-lg">
      <div ref={chartRef} />
    </div>
  );
};

export default LLMAccuracyChart;
