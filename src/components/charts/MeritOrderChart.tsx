import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend
} from 'recharts';
import type { TimePeriodDispatchResult, DispatchedBand } from '../../../shared/types';
import { formatMW, formatPrice } from '../../lib/formatters';

interface Props {
  periodResult: TimePeriodDispatchResult;
  height?: number;
}

interface MeritOrderDataPoint {
  cumulativeMW: number;
  widthMW: number;
  bidPrice: number;
  teamName: string;
  teamId: string;
  assetName: string;
  assetType: string;
  dispatchedMW: number;
  isMarginal: boolean;
  isDispatched: boolean;
  color: string;
}

// Team colors for the chart
const getTeamColor = (teamName: string, index: number): string => {
  const colors = [
    '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
    '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#c05621',
    '#2f855a', '#2b6cb0', '#6b46c1', '#b83280', '#e53e3e',
  ];
  return colors[index % colors.length];
};

export default function MeritOrderChart({ periodResult, height = 400 }: Props) {
  const chartData = useMemo(() => {
    if (!periodResult) return [];

    // Combine dispatched and undispatched bands
    const allBands = [
      ...periodResult.meritOrderStack.map(b => ({ ...b, isDispatched: true })),
      ...periodResult.undispatchedBands.map(b => ({ ...b, isDispatched: false })),
    ].sort((a, b) => a.bidPriceMWh - b.bidPriceMWh);

    // Track unique teams for coloring
    const teamColorMap = new Map<string, string>();
    let colorIdx = 0;

    let cumulativeMW = 0;
    return allBands
      .filter(b => b.offeredMW > 0)
      .map(band => {
        if (!teamColorMap.has(band.teamId)) {
          teamColorMap.set(band.teamId, getTeamColor(band.teamName, colorIdx++));
        }

        const point: MeritOrderDataPoint = {
          cumulativeMW,
          widthMW: band.offeredMW,
          bidPrice: Math.min(band.bidPriceMWh, 500), // Cap visual at $500 for readability
          teamName: band.teamName,
          teamId: band.teamId,
          assetName: band.assetName,
          assetType: band.assetType,
          dispatchedMW: band.dispatchedMW,
          isMarginal: band.isMarginal,
          isDispatched: band.dispatchedMW > 0,
          color: teamColorMap.get(band.teamId)!,
        };

        cumulativeMW += band.offeredMW;
        return point;
      });
  }, [periodResult]);

  if (!periodResult || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-navy-400">
        No dispatch data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-navy-800 border border-white/20 rounded-lg p-3 shadow-xl text-sm">
        <div className="font-semibold text-white">{data.teamName}</div>
        <div className="text-navy-300 text-xs">{data.assetName} ({data.assetType})</div>
        <div className="mt-1 space-y-0.5">
          <div className="text-electric-300">
            Bid: <span className="font-mono">${data.bidPrice}/MWh</span>
          </div>
          <div className="text-navy-300">
            Offered: <span className="font-mono">{data.widthMW} MW</span>
          </div>
          <div className={data.isDispatched ? 'text-green-400' : 'text-red-400'}>
            {data.isDispatched ? `Dispatched: ${data.dispatchedMW} MW` : 'Not dispatched'}
          </div>
          {data.isMarginal && (
            <div className="text-amber-400 font-semibold">★ Marginal Unit (sets price)</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="text-navy-300">
          Clearing Price: <span className="text-electric-300 font-mono font-bold text-lg">
            ${periodResult.clearingPriceMWh.toFixed(0)}/MWh
          </span>
        </div>
        <div className="text-navy-400">
          Demand: <span className="font-mono">{formatMW(periodResult.demandMW)}</span>
        </div>
        <div className="text-navy-400">
          Reserve: <span className="font-mono">{periodResult.reserveMarginPercent.toFixed(0)}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} barCategoryGap={0} barGap={0}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="cumulativeMW"
            type="number"
            domain={[0, 'auto']}
            tick={{ fill: '#a0aec0', fontSize: 11 }}
            label={{ value: 'Cumulative MW', position: 'bottom', fill: '#a0aec0', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#a0aec0', fontSize: 11 }}
            label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fill: '#a0aec0', fontSize: 12 }}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Demand line */}
          <ReferenceLine
            x={periodResult.demandMW}
            stroke="#e53e3e"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: `Demand ${formatMW(periodResult.demandMW)}`, fill: '#fc8181', fontSize: 11, position: 'top' }}
          />

          {/* Clearing price line */}
          <ReferenceLine
            y={periodResult.clearingPriceMWh > 500 ? 500 : periodResult.clearingPriceMWh}
            stroke="#ecc94b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: `$${periodResult.clearingPriceMWh.toFixed(0)}/MWh`, fill: '#ecc94b', fontSize: 11, position: 'right' }}
          />

          <Bar dataKey="bidPrice" name="Bid Price">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isDispatched ? entry.color : `${entry.color}33`}
                stroke={entry.isMarginal ? '#ecc94b' : 'transparent'}
                strokeWidth={entry.isMarginal ? 3 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
