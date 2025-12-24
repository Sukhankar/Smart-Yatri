import Sidebar from '../../components/Sidebar';

export default function SystemConfig() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">System Configuration</h1>
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">System configuration coming soon</p>
        </div>
      </div>
    </div>
  );
}
