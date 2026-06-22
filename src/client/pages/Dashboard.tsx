import React from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  Boxes,
  TrendingUp,
  Zap,
  ArrowRight,
  Activity,
  DollarSign,
  Clock,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data - in real app, fetch from API
  const stats = {
    totalProviders: 8,
    totalModels: 24,
    todayRequests: 12580,
    todayCost: 128.45,
    todayInputTokens: 2450000,
    todayOutputTokens: 1820000,
  };

  const quickActions = [
    {
      title: '添加渠道',
      description: '配置新的API渠道',
      icon: <Network className="text-blue-500" size={24} />,
      link: '/providers/new',
      color: 'from-blue-500/10 to-blue-500/5 border-blue-200',
    },
    {
      title: '添加模型',
      description: '添加新的AI模型',
      icon: <Boxes className="text-purple-500" size={24} />,
      link: '/models',
      color: 'from-purple-500/10 to-purple-500/5 border-purple-200',
    },
    {
      title: '查看统计',
      description: '分析使用情况',
      icon: <TrendingUp className="text-green-500" size={24} />,
      link: '/stats',
      color: 'from-green-500/10 to-green-500/5 border-green-200',
    },
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">欢迎回来</h1>
            <p className="text-blue-100">以下是今日的 API 使用概览</p>
          </div>
          <Zap className="text-yellow-300" size={48} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="渠道总数"
          value={stats.totalProviders}
          subtitle="活跃渠道"
          icon={<Network size={24} />}
          color="bg-blue-100"
        />
        <StatCard
          title="模型总数"
          value={stats.totalModels}
          subtitle="已配置模型"
          icon={<Boxes size={24} />}
          color="bg-purple-100"
        />
        <StatCard
          title="今日请求"
          value={stats.todayRequests.toLocaleString()}
          subtitle="较昨日 +12.5%"
          icon={<Activity size={24} />}
          color="bg-green-100"
        />
        <StatCard
          title="今日消费"
          value={`$${stats.todayCost.toFixed(2)}`}
          subtitle="较昨日 -3.2%"
          icon={<DollarSign size={24} />}
          color="bg-yellow-100"
        />
      </div>

      {/* Token stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-500" size={20} />
            </div>
            <span className="font-semibold text-gray-800">Token 使用统计</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">输入 Token</span>
                <span className="font-medium text-gray-700">
                  {(stats.todayInputTokens / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">输出 Token</span>
                <span className="font-medium text-gray-700">
                  {(stats.todayOutputTokens / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                  style={{ width: '45%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="text-green-500" size={20} />
            </div>
            <span className="font-semibold text-gray-800">响应时间</span>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">128ms</p>
              <p className="text-sm text-gray-500">平均延迟</p>
            </div>
            <div className="flex-1">
              <div className="h-12 flex items-end gap-1">
                {[40, 55, 45, 60, 50, 45, 55, 48, 52, 58, 46, 52].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-green-400 to-green-300 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className={`
                group p-6 rounded-2xl border-2 bg-gradient-to-br transition-all duration-200
                hover:shadow-lg hover:-translate-y-1
                ${action.color}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white rounded-xl shadow-sm">{action.icon}</div>
                <ArrowRight
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
                />
              </div>
              <h3 className="mt-4 font-semibold text-gray-800">{action.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
