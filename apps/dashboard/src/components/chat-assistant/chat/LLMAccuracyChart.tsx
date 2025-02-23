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
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: true,
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return val + '%';
          },
          style: {
            fontSize: '12px',
          }
        },
        xaxis: {
          categories: ['GPT-4', 'Claude 2', 'PaLM 2', 'GPT-3.5', 'LLAMA 2'],
          labels: {
            show: true,
            style: {
              colors: '#6B7280',
              fontSize: '12px',
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#6B7280',
              fontSize: '12px',
            }
          }
        },
        colors: ['#3B82F6'],
        title: {
          text: 'LLM Model Accuracy',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 600,
          }
        },
        theme: {
          mode: 'light'
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
    <div className="w-full max-w-[500px] mx-auto mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div ref={chartRef} />
    </div>
  );
};

export default LLMAccuracyChart;
