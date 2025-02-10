'use client';

import { type FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface AxisGraphProps {
  data: DataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
}

export const AxisGraph: FC<AxisGraphProps> = ({
  data,
  xAxisLabel,
  yAxisLabel,
  title,
}) => {
  return (
    <div className="w-full h-full min-h-[300px]">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -10 }
                : undefined
            }
          />
          <YAxis
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                  }
                : undefined
            }
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
