import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { OpenAI, Anthropic, Azure, DeepSeek, Gemini } from '@lobehub/icons';
import type { Provider } from '../types';

const Providers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock data - in real app, fetch from API
  const providers: Provider[] = [
    {
      id: '1',
      name: 'OpenAI',
      logo: 'openai',
      format: 'openai',
      baseURL: 'https://api.openai.com/v1',
      keys: [
        { id: 'k1', key: 'sk-xxxx...xxxx', enabled: true },
        { id: 'k2', key: 'sk-xxxx...xxxx', enabled: false },
      ],
      models: [
        { remoteModel: 'gpt-4', localModel: 'gpt-4' },
        { remoteModel: 'gpt-4-turbo', localModel: 'gpt-4-turbo' },
      ],
      weight: 30,
      enabled: true,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-06-20T10:30:00Z',
    },
    {
      id: '2',
      name: 'Anthropic',
      logo: 'claude',
      format: 'anthropic',
      baseURL: 'https://api.anthropic.com/v1',
      keys: [{ id: 'k3', key: 'sk-ant-xxxx...xxxx', enabled: true }],
      models: [
        { remoteModel: 'claude-3-opus', localModel: 'claude-3-opus' },
        { remoteModel: 'claude-3-sonnet', localModel: 'claude-3-sonnet' },
      ],
      weight: 25,
      enabled: true,
      createdAt: '2024-02-10T09:00:00Z',
      updatedAt: '2024-06-18T14:20:00Z',
    },
    {
      id: '3',
      name: 'Azure OpenAI',
      logo: 'azure',
      format: 'azure',
      baseURL: 'https://xxx.openai.azure.com/v1',
      keys: [{ id: 'k4', key: 'xxxx...xxxx', enabled: true }],
      models: [{ remoteModel: 'gpt-4', localModel: 'gpt-4' }],
      weight: 20,
      enabled: false,
      createdAt: '2024-03-05T10:00:00Z',
      updatedAt: '2024-06-15T16:45:00Z',
    },
    {
      id: '4',
      name: 'DeepSeek',
      logo: 'deepseek',
      format: 'openai',
      baseURL: 'https://api.deepseek.com/v1',
      keys: [{ id: 'k5', key: 'sk-xxxx...xxxx', enabled: true }],
      models: [
        { remoteModel: 'deepseek-chat', localModel: 'deepseek-chat' },
        { remoteModel: 'deepseek-coder', localModel: 'deepseek-coder' },
      ],
      weight: 15,
      enabled: true,
      createdAt: '2024-04-20T11:00:00Z',
      updatedAt: '2024-06-10T08:15:00Z',
    },
    {
      id: '5',
      name: 'Gemini Pro',
      logo: 'gemini',
      format: 'custom',
      baseURL: 'https://generativelanguage.googleapis.com/v1',
      keys: [{ id: 'k6', key: 'AIza...xxxx', enabled: true }],
      models: [{ remoteModel: 'gemini-pro', localModel: 'gemini-pro' }],
      weight: 10,
      enabled: true,
      createdAt: '2024-05-12T14:30:00Z',
      updatedAt: '2024-06-08T12:00:00Z',
    },
  ];

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFormatBadge = (format: Provider['format']) => {
    const badges = {
      openai: 'bg-green-100 text-green-700',
      anthropic: 'bg-orange-100 text-orange-700',
      azure: 'bg-blue-100 text-blue-700',
      custom: 'bg-purple-100 text-purple-700',
    };
    return badges[format];
  };

  const getProviderLogo = (logo?: string) => {
    const logoMap: Record<string, React.ReactNode> = {
      openai: <OpenAI size={32} />,
      anthropic: <Anthropic size={32} />,
      azure: <Azure size={32} />,
      deepseek: <DeepSeek size={32} />,
      gemini: <Gemini size={32} />,
    };
    const LogoComponent = logo ? logoMap[logo] : null;
    return LogoComponent ? (
      LogoComponent
    ) : (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
        <span className="text-white text-sm font-bold">
          {logo?.charAt(0).toUpperCase() || '?'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">渠道管理</h1>
          <p className="text-gray-500 mt-1">管理您的 API 渠道和密钥</p>
        </div>
        <Link
          to="/providers/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <Plus size={20} />
          添加渠道
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索渠道..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      </div>

      {/* Provider grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProviders.map((provider) => (
          <div
            key={provider.id}
            className={`
              bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md
              ${provider.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">{getProviderLogo(provider.logo)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${getFormatBadge(provider.format)}`}
                    >
                      {provider.format.toUpperCase()}
                    </span>
                  </div>
                  <a
                    href={provider.baseURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-blue-500 flex items-center gap-1 mt-0.5"
                  >
                    {provider.baseURL.slice(0, 40)}...
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreVertical size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Keys */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">API Keys</p>
              <div className="space-y-2">
                {provider.keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {key.enabled ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <XCircle size={14} className="text-gray-400" />
                      )}
                      <span className="text-sm font-mono text-gray-600">{key.key}</span>
                    </div>
                    <button
                      onClick={() => copyKey(key.key, key.id)}
                      className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    >
                      {copiedId === key.id ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Models */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                模型映射 ({provider.models.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {provider.models.slice(0, 3).map((m, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md"
                  >
                    {m.localModel}
                  </span>
                ))}
                {provider.models.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                    +{provider.models.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">权重</span>
                  <span className="ml-2 font-medium text-gray-900">{provider.weight}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-500">
                  <Edit size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  {provider.enabled ? (
                    <ToggleRight size={20} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-500">没有找到匹配的渠道</p>
        </div>
      )}
    </div>
  );
};

export default Providers;
