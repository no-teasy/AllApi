import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  PieChart,
} from 'lucide-react';

const Stats: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Mock data
  const summary = {
    totalCost: 3842.56,
    totalRequests: 125893,
    totalInputTokens: 45600000,
    totalOutputTokens: 32800000,
    costChange: 12.5,
    requestsChange: 8.3,
  };

  const dailyData = [
    { date: '06-16', requests: 15234, cost: 145.23, tokens: 5200000 },
    { date: '06-17', requests: 18456, cost: 168.45, tokens: 6100000 },
    { date: '06-18', requests: 16890, cost: 156.78, tokens: 5800000 },
    { date: '06-19', requests: 19567, cost: 182.34, tokens: 6700000 },
    { date: '06-20', requests: 21234, cost: 198.56, tokens: 7200000 },
    { date: '06-21', requests: 18765, cost: 175.89, tokens: 6500000 },
    { date: '06-22', requests: 16747, cost: 158.31, tokens: 5900000 },
  ];

  const providerData = [
    { name: 'OpenAI', requests: 45234, cost: 1234.56, percentage: 35.9 },
    { name: 'Anthropic', requests: 32456, cost: 987.23, percentage: 25.7 },
    { name: 'DeepSeek', requests: 28456, cost: 156.78, percentage: 22.6 },
    { name: 'Azure', requests: 12456, cost: 892.34, percentage: 9.9 },
    { name: 'Gemini', requests: 7291, cost: 571.65, percentage: 5.8 },
  ];

  const modelData = [
    { name: 'GPT-4', requests: 28456, cost: 756.23 },
    { name: 'Claude-3-Opus', requests: 18234, cost: 567.89 },
    { name: 'GPT-4-Turbo', requests: 15456, cost: 456.12 },
    { name: 'Claude-3-Sonnet', requests: 14222, cost: 419.34 },
    { name: 'DeepSeek-V2', requests: 12456, cost: 156.78 },
  ];

  const timeRanges = [
    { value: '7d', label: '最近 7 天' },
    { value: '30d', label: '最近 30 天' },
    { value: '90d', label: '最近 90 天' },
  ];

  const maxCost = Math.max(...dailyData.map((d) => d.cost));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">使用统计</h1>
          <p className="text-gray-500 mt-1">分析 API 使用情况和成本</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${timeRange === range.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                `}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={18} />
            导出
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">总消费</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${summary.totalCost.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-1">
                {summary.costChange >= 0 ? (
                  <TrendingUp size={14} className="text-red-500" />
                ) : (
                  <TrendingDown size={14} className="text-green-500" />
                )}
                <span
                  className={`text-sm ${summary.costChange >= 0 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {summary.costChange >= 0 ? '+' : ''}{summary.costChange}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <BarChart3 className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">总请求</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(summary.totalRequests / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center gap-1 mt-1">
                {summary.requestsChange >= 0 ? (
                  <TrendingUp size={14} className="text-green-500" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
                <span
                  className={`text-sm ${summary.requestsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {summary.requestsChange >= 0 ? '+' : ''}{summary.requestsChange}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <PieChart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">输入 Token</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(summary.totalInputTokens / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">输出 Token</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(summary.totalOutputTokens / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">每日消费趋势</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <BarChart3 size={18} />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <TrendingUp size={18} />
              </button>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2">
            {dailyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">${day.cost.toFixed(0)}</span>
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${(day.cost / maxCost) * 180}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-6">渠道分布</h3>
          <div className="space-y-4">
            {providerData.map((provider, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{provider.name}</span>
                  <span className="text-sm text-gray-500">${provider.cost.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${provider.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">模型使用排行</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">排名</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">模型</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">请求数</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">消费</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-48">占比</th>
              </tr>
            </thead>
            <tbody>
              {modelData.map((model, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4">
                    <span
                      className={`
                      w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${index === 1 ? 'bg-gray-200 text-gray-700' : ''}
                      ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                      ${index > 2 ? 'bg-gray-50 text-gray-500' : ''}
                    `}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{model.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-600">{model.requests.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-gray-900">${model.cost.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${(model.cost / modelData[0].cost) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12">
                        {((model.cost / modelData[0].cost) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stats;
