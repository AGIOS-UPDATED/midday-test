'use client';

import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useTheme } from 'next-themes';

const LLMAccuracyChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (chartRef.current) {
      const options: ApexOptions = {
        series: [{
          name: 'Accuracy',
          data: [98.5, 97.8, 96.5, 95.2, 94.7, 93.8, 92.5, 91.2],
        }],
        chart: {
          type: 'bar',
          height: 350,
          width: '100%',
          toolbar: {
            show: false
          },
          background: 'transparent',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: false,
            distributed: true,
            dataLabels: {
              position: 'top'
            },
            columnWidth: '50%',
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          },
          style: {
            fontSize: '13px',
            fontWeight: 600,
            colors: [isDark ? '#F1F1F1' : '#333333']
          },
          offsetY: -20
        },
        xaxis: {
          categories: [
            'Claude 3.5 Sonnet v2',
            'GPT-4 Turbo',
            'Claude 3',
            'Deepseek Reasoner',
            'PaLM 2',
            'GPT-3.5 Turbo',
            'Deepseek Chat',
            'LLAMA 2'
          ],
          labels: {
            style: {
              colors: isDark ? '#F1F1F1' : '#333333',
              fontSize: '13px',
              fontWeight: 500
            },
            rotate: -45,
            offsetY: 5
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          min: 85,
          max: 100,
          labels: {
            style: {
              colors: isDark ? '#F1F1F1' : '#333333',
              fontSize: '13px',
              fontWeight: 500
            },
            formatter: function (val: number) {
              return val.toFixed(1) + '%';
            }
          }
        },
        grid: {
          show: true,
          borderColor: isDark ? 'rgba(241, 241, 241, 0.1)' : 'rgba(51, 51, 51, 0.1)',
          strokeDashArray: 4,
          xaxis: {
            lines: {
              show: false
            }
          },
          yaxis: {
            lines: {
              show: true
            }
          },
          padding: {
            top: 20,
            right: 0,
            bottom: 0,
            left: 0
          }
        },
        colors: [
          '#00A3FF',
          '#00A3FF',
          '#00A3FF',
          '#00A3FF',
          '#00A3FF',
          '#00A3FF',
          '#00A3FF',
          '#00A3FF'
        ],
        states: {
          hover: {
            filter: {
              type: 'darken',
              value: 0.15
            }
          },
          active: {
            filter: {
              type: 'darken',
              value: 0.15
            }
          }
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          y: {
            formatter: function (val: number) {
              return val.toFixed(1) + '% Accuracy';
            }
          }
        },
        theme: {
          mode: isDark ? 'dark' : 'light'
        }
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, [theme]);

  return (
    <div className="w-full max-w-[1800px] mx-auto mb-8 p-6 rounded-xl bg-card">
      <div ref={chartRef} className="chart-container" />
    </div>
  );
};

export default LLMAccuracyChart;
