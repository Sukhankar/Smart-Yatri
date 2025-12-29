import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { systemSettingsService } from '../../services/systemSettingsService';

export default function SystemConfig() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('GENERAL');
  const [editedSettings, setEditedSettings] = useState({});

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line
  }, [selectedCategory]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await systemSettingsService.getSystemSettings(selectedCategory);
      setSettings(data.settings || []);
      // Initialize edited settings
      const initialEdited = {};
      data.settings.forEach(setting => {
        initialEdited[setting.key] = setting.value;
      });
      setEditedSettings(initialEdited);
    } catch (err) {
      console.error('Error loading system settings:', err);
      alert(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key) => {
    setSaving(true);
    try {
      await systemSettingsService.updateSystemSetting(key, editedSettings[key]);
      // Update the local settings
      setSettings(prev => prev.map(setting =>
        setting.key === key ? { ...setting, value: editedSettings[key] } : setting
      ));
      alert('Setting updated successfully');
    } catch (err) {
      console.error('Error updating setting:', err);
      alert(err.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async () => {
    const key = prompt('Enter setting key:');
    if (!key) return;

    const value = prompt('Enter setting value:');
    if (value === null) return;

    const description = prompt('Enter description (optional):');

    setSaving(true);
    try {
      await systemSettingsService.updateSystemSetting(key, value);
      // Reload settings
      loadSettings();
      alert('Setting added successfully');
    } catch (err) {
      console.error('Error adding setting:', err);
      alert(err.message || 'Failed to add setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async (key) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) return;

    try {
      await systemSettingsService.deleteSystemSetting(key);
      setSettings(prev => prev.filter(setting => setting.key !== key));
      setEditedSettings(prev => {
        const newEdited = { ...prev };
        delete newEdited[key];
        return newEdited;
      });
      alert('Setting deleted successfully');
    } catch (err) {
      console.error('Error deleting setting:', err);
      alert(err.message || 'Failed to delete setting');
    }
  };

  const categories = ['GENERAL', 'SECURITY', 'PAYMENT', 'NOTIFICATION'];

  const renderSettingInput = (setting) => {
    const value = editedSettings[setting.key] || '';
    const hasChanged = value !== setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="JSON value"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">System Configuration</h1>
            <p className="text-gray-600 mt-2">Manage system-wide settings and configurations</p>
          </div>
          <button
            onClick={handleAddSetting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Setting
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-1 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Settings List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading settings...</p>
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No settings found in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{setting.key}</h3>
                      {setting.description && (
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Type: {setting.type}</p>
                    </div>
                    <div className="flex space-x-2">
                      {editedSettings[setting.key] !== setting.value && (
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={saving}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSetting(setting.key)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 w-20">Value:</label>
                    {renderSettingInput(setting)}
                  </div>
                  {editedSettings[setting.key] !== setting.value && (
                    <p className="text-xs text-orange-600 mt-2">
                      Unsaved changes - click Save to apply
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Default Settings Suggestions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Suggested Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900">General Settings</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• APP_NAME: Application name</li>
                <li>• APP_VERSION: Current version</li>
                <li>• MAINTENANCE_MODE: Enable/disable maintenance</li>
                <li>• DEFAULT_TIMEZONE: System timezone</li>
              </ul>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900">Security Settings</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• SESSION_TIMEOUT: Session duration (minutes)</li>
                <li>• PASSWORD_MIN_LENGTH: Minimum password length</li>
                <li>• MAX_LOGIN_ATTEMPTS: Max failed login attempts</li>
                <li>• ENABLE_2FA: Enable two-factor authentication</li>
              </ul>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900">Payment Settings</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• PAYMENT_GATEWAY: Payment provider</li>
                <li>• CURRENCY: Default currency</li>
                <li>• TAX_RATE: Tax percentage</li>
                <li>• PAYMENT_TIMEOUT: Payment timeout (minutes)</li>
              </ul>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900">Notification Settings</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• EMAIL_ENABLED: Enable email notifications</li>
                <li>• SMS_ENABLED: Enable SMS notifications</li>
                <li>• PUSH_ENABLED: Enable push notifications</li>
                <li>• NOTIFICATION_FROM_EMAIL: Sender email</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
