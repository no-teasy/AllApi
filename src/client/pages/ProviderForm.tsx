import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Settings,
  Key,
  Box,
} from 'lucide-react';
import type { Provider, ProviderKey, ModelMapping } from '../types';

const ProviderForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<Provider>>({
    name: '',
    logo: '',
    format: 'openai',
    baseURL: '',
    keys: [{ id: crypto.randomUUID(), key: '', enabled: true }],
    models: [{ remoteModel: '', localModel: '' }],
    weight: 1,
    enabled: true,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'keys' | 'models'>('basic');

  const formatOptions = [
    { value: 'openai', label: 'OpenAI 兼容', description: '支持 OpenAI 格式的 API' },
    { value: 'anthropic', label: 'Anthropic', description: 'Claude 系列模型' },
    { value: 'azure', label: 'Azure OpenAI', description: 'Azure 托管的 OpenAI' },
    { value: 'custom', label: '自定义', description: '其他格式的 API' },
  ];

  const addKey = () => {
    setFormData({
      ...formData,
      keys: [...(formData.keys || []), { id: crypto.randomUUID(), key: '', enabled: true }],
    });
  };

  const removeKey = (keyId: string) => {
    setFormData({
      ...formData,
      keys: (formData.keys || []).filter((k) => k.id !== keyId),
    });
  };

  const updateKey = (keyId: string, updates: Partial<ProviderKey>) => {
    setFormData({
      ...formData,
      keys: (formData.keys || []).map((k) => (k.id === keyId ? { ...k, ...updates } : k)),
    });
  };

  const addModel = () => {
    setFormData({
      ...formData,
      models: [...(formData.models || []), { remoteModel: '', localModel: '' }],
    });
  };

  const removeModel = (index: number) => {
    setFormData({
      ...formData,
      models: (formData.models || []).filter((_, i) => i !== index),
    });
  };

  const updateModel = (index: number, updates: Partial<ModelMapping>) => {
    setFormData({
      ...formData,
      models: (formData.models || []).map((m, i) => (i === index ? { ...m, ...updates } : m)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit:', formData);
    navigate('/providers');
  };

  const tabs = [
    { id: 'basic', label: '基础配置', icon: <Settings size={16} /> },
    { id: 'keys', label: 'API Keys', icon: <Key size={16} />, count: formData.keys?.length },
    { id: 'models', label: '模型映射', icon: <Box size={16} />, count: formData.models?.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/providers')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '编辑渠道' : '新增渠道'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? '修改渠道配置信息' : '配置新的 API 渠道'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-colors relative
                ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                  ml-1 px-2 py-0.5 text-xs rounded-full
                  ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                `}
                >
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    渠道名称
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：OpenAI"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <input
                    type="text"
                    value={formData.logo || ''}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="例如：openai, claude, deepseek"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API 格式</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formatOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${
                          formData.format === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={formData.format === option.value}
                        onChange={(e) =>
                          setFormData({ ...formData, format: e.target.value as Provider['format'] })
                        }
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                <input
                  type="text"
                  value={formData.baseURL || ''}
                  onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  权重 (负载均衡)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.weight || 1}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  className="w-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                <p className="text-sm text-gray-500 mt-1">默认为 1，数值越大权重越高</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${formData.enabled ? 'bg-blue-500' : 'bg-gray-300'}
                  `}
                >
                  <div
                    className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${formData.enabled ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formData.enabled ? '启用' : '禁用'}
                </span>
              </div>
            </div>
          )}

          {/* Keys Tab */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">管理 API Keys，支持多个密钥轮询</p>
                <button
                  type="button"
                  onClick={addKey}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  添加 Key
                </button>
              </div>

              <div className="space-y-3">
                {formData.keys?.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                  >
                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                    <input
                      type="password"
                      value={key.key}
                      onChange={(e) => updateKey(key.id, { key: e.target.value })}
                      placeholder="sk-xxxx...xxxx"
                      className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 focus:border-blue-500 outline-none font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateKey(key.id, { enabled: !key.enabled })}
                      className={`
                        px-3 py-1 text-xs font-medium rounded-full transition-colors
                        ${key.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}
                      `}
                    >
                      {key.enabled ? '启用' : '禁用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeKey(key.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={formData.keys!.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">配置远程模型到本地模型的映射</p>
                <button
                  type="button"
                  onClick={addModel}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  添加映射
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 px-4">
                  <span className="text-sm font-medium text-gray-500">远程模型</span>
                  <span className="text-sm font-medium text-gray-500">本地模型</span>
                </div>
                {formData.models?.map((model, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                    <input
                      type="text"
                      value={model.remoteModel}
                      onChange={(e) => updateModel(index, { remoteModel: e.target.value })}
                      placeholder="gpt-4"
                      className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="text"
                      value={model.localModel}
                      onChange={(e) => updateModel(index, { localModel: e.target.value })}
                      placeholder="gpt-4"
                      className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeModel(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={formData.models!.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/providers')}
              className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <Save size={18} />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderForm;
