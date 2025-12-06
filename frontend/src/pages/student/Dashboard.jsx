import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qrService } from '../../services/qrService';
import { passService } from '../../services/passService';
import { notificationService } from '../../services/notificationService';

import Sidebar from '../../components/Sidebar';
import QRDisplay from '../../components/QRDisplay';

import { QrCode, Ticket, History, Bell, BadgeCheck, Clock } from "lucide-react";

export default function StudentDashboard() {
  const [qrData, setQrData] = useState(null);
  const [pass, setPass] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [qrRes, passRes, notifRes] = await Promise.all([
        qrService.generateQR().catch(() => null),
        passService.getUserPass().catch(() => null),
        notificationService.listNotifications().catch(() => null),
      ]);
      if (qrRes) setQrData(qrRes);
      if (passRes?.pass) setPass(passRes.pass);
      if (notifRes?.notifications) setNotifications(notifRes.notifications);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-xs">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />

      <div className="flex-1 p-1 md:p-2 lg:p-3">
        <h1 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
          Student Dashboard
        </h1>

        {/* QR + PASS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-4">

          {/* QR Code */}
          <div className="bg-white rounded-lg shadow border border-gray-100 p-2 hover:shadow-md transition">
            <div className="flex items-center gap-1 mb-1">
              <QrCode className="w-3 h-3 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-800">My QR Code</h2>
            </div>
            {qrData ? (
              <QRDisplay
                qrCode={qrData.qrCode}
                qrId={qrData.qrId}
                status={pass?.status || 'NO_PASS'}
                profile={qrData.profile}
              />
            ) : (
              <p className="text-gray-500 text-[10px]">Unable to load QR code.</p>
            )}
          </div>

          {/* PASS STATUS */}
          <div className="bg-white rounded-lg shadow border border-gray-100 p-2 hover:shadow-md transition">
            <div className="flex items-center gap-1 mb-1">
              <BadgeCheck className="w-3 h-3 text-green-600" />
              <h2 className="text-base font-semibold text-gray-800">Pass Status</h2>
            </div>
            {pass ? (
              <div className="space-y-1">
                <div>
                  <p className="text-[10px] text-gray-500">Pass Type</p>
                  <p className="text-sm font-semibold">{pass.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium
                      ${
                        pass.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : pass.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {pass.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Valid Until</p>
                  <p className="text-sm font-medium">{new Date(pass.endDate).toLocaleDateString()}</p>
                </div>
                {pass.status === 'PENDING' && (
                  <p className="text-[10px] text-yellow-700">Awaiting approval from admin.</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-1 text-[10px]">You do not have an active pass</p>
                <button
                  onClick={() => navigate('/student/my-pass')}
                  className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow"
                >
                  Get a Pass
                </button>
              </div>
            )}
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">

          {/* Buy Ticket */}
          <button
            onClick={() => navigate('/student/book-ticket')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2 rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-1">
              <Ticket className="w-4 h-4 opacity-90" />
              <div className="text-left">
                <h3 className="text-sm font-semibold">Buy Ticket</h3>
                <p className="text-[10px] opacity-90">Purchase your travel ticket</p>
              </div>
            </div>
          </button>

          {/* My Tickets */}
          <button
            onClick={() => navigate('/student/my-tickets')}
            className="bg-gradient-to-br from-green-600 to-green-700 text-white p-2 rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-1">
              <Ticket className="w-4 h-4 opacity-90" />
              <div className="text-left">
                <h3 className="text-sm font-semibold">My Tickets</h3>
                <p className="text-[10px] opacity-90">View ticket history</p>
              </div>
            </div>
          </button>

          {/* Travel History */}
          <button
            onClick={() => navigate('/student/travel-history')}
            className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-2 rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-1">
              <History className="w-4 h-4 opacity-90" />
              <div className="text-left">
                <h3 className="text-sm font-semibold">Travel History</h3>
                <p className="text-[10px] opacity-90">View your past travel records</p>
              </div>
            </div>
          </button>

        </div>

        {/* NOTIFICATIONS */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-100 p-2">
            <div className="flex items-center gap-1 mb-1">
              <Bell className="w-3 h-3 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-800">Recent Notifications</h2>
            </div>
            <div className="space-y-1">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-1 rounded-md border-l-4 transition
                    ${
                      notif.isRead
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                >
                  <h4 className="font-semibold text-xs">{notif.title}</h4>
                  <p className="text-[10px] text-gray-600">{notif.message}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
