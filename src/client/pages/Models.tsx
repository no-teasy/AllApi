import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Box,
} from 'lucide-react';
import { OpenAI, Anthropic, DeepSeek, Gemini } from '@lobehub/icons';
import type { Model } from '../types';

const Models: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Models list - user added
  const [models, setModels] = useState<Model[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    provider: '',
    inputPrice: 0,
    outputPrice: 0,
  });

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModelIcon = (icon?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      gpt4: <OpenAI size={28} />,
      claude: <Anthropic size={28} />,
      deepseek: <DeepSeek size={28} />,
      gemini: <Gemini size={28} />,
    };
    const IconComponent = icon ? iconMap[icon] : null;
    return IconComponent ? (
      IconComponent
    ) : (
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
        <Box className="text-white" size={16} />
      </div>
    );
  };

  const handleEditPrice = (model: Model) => {
    setSelectedModel(model);
    setShowPriceModal(true);
  };

  const handleAddModel = () => {
    if (!newModel.name || !newModel.provider) return;
    const model: Model = {
      id: crypto.randomUUID(),
      name: newModel.name,
      provider: newModel.provider,
      inputPrice: newModel.inputPrice,
      outputPrice: newModel.outputPrice,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setModels([...models, model]);
    setNewModel({ name: '', provider: '', inputPrice: 0, outputPrice: 0 });
    setShowAddModal(false);
  };

  const handleToggleModel = (id: string) => {
    setModels(models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const handleDeleteModel = (id: string) => {
    setModels(models.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模型管理</h1>
          <p className="text-gray-500 mt-1">配置和管理 AI 模型定价</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <Plus size={20} />
          添加模型
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索模型..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      </div>

      {/* Models table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">模型</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">提供商</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  输入价格
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  输出价格
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => (
                <tr
                  key={model.id}
                  className={`
                    border-b border-gray-100 last:border-0 transition-colors
                    ${model.enabled ? '' : 'bg-gray-50/50'}
                  `}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl">{getModelIcon(model.icon)}</div>
                      <span className="font-medium text-gray-900">{model.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{model.provider}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-gray-900">
                      <DollarSign size={14} className="text-gray-400" />
                      <span className="font-medium">${model.inputPrice.toFixed(4)}</span>
                      <span className="text-gray-400 text-xs">/1K</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-gray-900">
                      <DollarSign size={14} className="text-gray-400" />
                      <span className="font-medium">${model.outputPrice.toFixed(4)}</span>
                      <span className="text-gray-400 text-xs">/1K</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleModel(model.id)}
                      className="inline-flex items-center gap-1"
                    >
                      {model.enabled ? (
                        <>
                          <ToggleRight size={20} className="text-green-500" />
                          <span className="text-sm text-green-600">启用</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={20} className="text-gray-400" />
                          <span className="text-sm text-gray-500">禁用</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditPrice(model)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-500"
                        title="编辑价格"
                      >
                        <DollarSign size={16} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-500">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredModels.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Box className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500 mb-4">暂无模型，点击上方按钮添加</p>
          </div>
        )}

        {filteredModels.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500">没有找到匹配的模型</p>
          </div>
        )}
      </div>

      {/* Price Edit Modal */}
      {showPriceModal && selectedModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑价格 - {selectedModel.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入价格 ($/1K tokens)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  defaultValue={selectedModel.inputPrice}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输出价格 ($/1K tokens)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  defaultValue={selectedModel.outputPrice}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedModel(null);
                }}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedModel(null);
                }}
                className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加模型</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模型名称</label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="例如：GPT-4"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">提供商</label>
                <input
                  type="text"
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  placeholder="例如：OpenAI"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入价格 ($/1K tokens)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={newModel.inputPrice}
                  onChange={(e) => setNewModel({ ...newModel, inputPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输出价格 ($/1K tokens)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={newModel.outputPrice}
                  onChange={(e) => setNewModel({ ...newModel, outputPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewModel({ name: '', provider: '', inputPrice: 0, outputPrice: 0 });
                }}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddModel}
                className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Models;
