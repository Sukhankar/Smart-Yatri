import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

export default function PricingRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({
    ticketType: 'DAILY',
    basePrice: 50,
    studentPrice: 35,
    staffPrice: 42.5,
    regularPrice: 50,
  });

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    setError('');
    try {
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${SERVER_URL}/api/admin/pricing-rules`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load rules');
      setRules(data.rules || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pricing rules');
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (rule) => {
    setForm({
      ticketType: rule.ticketType,
      basePrice: rule.basePrice,
      studentPrice: rule.studentPrice,
      staffPrice: rule.staffPrice,
      regularPrice: rule.regularPrice,
    });
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${SERVER_URL}/api/admin/pricing-rules/${form.ticketType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          basePrice: Number(form.basePrice),
          studentPrice: Number(form.studentPrice),
          staffPrice: Number(form.staffPrice),
          regularPrice: Number(form.regularPrice),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update rule');
      setShowModal(false);
      await loadRules();
    } catch (err) {
      setError(err.message || 'Failed to save pricing rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex">
      <Sidebar role="admin" />

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 to-pink-600 bg-clip-text text-transparent mb-2">
              Manage Pricing Rules
            </h1>
            <p className="text-gray-600">
              Configure base prices and discounts for different user types.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Pricing Rules</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ticket Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Base Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Staff Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Regular Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-lg">
                      Loading...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-lg">
                      No pricing rules found.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.ticketType} className="hover:bg-red-50/30 transition">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                        {rule.ticketType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{rule.basePrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                        ₹{rule.studentPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-700">
                        ₹{rule.staffPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        ₹{rule.regularPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <button
                          onClick={() => handleEditClick(rule)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-3 py-1 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold text-xs"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingRule ? 'Edit' : 'Add'} Pricing Rule
              </h3>
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Ticket Type
                  </label>
                  <input
                    type="text"
                    value={form.ticketType}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={form.basePrice}
                    onChange={handleModalChange}
                    min={0}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Student Price (₹)
                  </label>
                  <input
                    type="number"
                    name="studentPrice"
                    value={form.studentPrice}
                    onChange={handleModalChange}
                    min={0}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Staff Price (₹)
                  </label>
                  <input
                    type="number"
                    name="staffPrice"
                    value={form.staffPrice}
                    onChange={handleModalChange}
                    min={0}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Regular Price (₹)
                  </label>
                  <input
                    type="number"
                    name="regularPrice"
                    value={form.regularPrice}
                    onChange={handleModalChange}
                    min={0}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2 font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl py-2 font-semibold hover:from-red-600 hover:to-pink-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}