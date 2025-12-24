import { useState, useRef, useEffect, useMemo } from 'react';
// No router-dom/logout/services/conductorService imports per guidance (don't add services), just UI update
import { Html5Qrcode } from 'html5-qrcode';
import { qrService } from '../../services/qrService';
import { routeService } from '../../services/routeService';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

function resolvePhoto(photoPath, fallbackName = '') {
  if (!photoPath)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'User')}&background=3b82f6&color=fff&size=128`;
  if (/^(data:|https?:\/\/)/.test(photoPath)) return photoPath;
  if (/^\/?uploads\//.test(photoPath)) {
    return SERVER_URL.replace(/\/+$/, '') + '/' + photoPath.replace(/^\/+/, '');
  }
  return photoPath;
}

export default function ConductorScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState('');
  const readerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // UI accent color scheme
  const bgMain = "bg-gradient-to-br from-slate-950 via-indigo-900/80 to-slate-900";
  const card = "rounded-3xl shadow-xl border border-slate-700";
  const scanBtn = "bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 focus:ring-2 focus:ring-emerald-300 text-white";
  const inputStyle = "rounded-xl p-3 bg-slate-800 text-white border border-slate-600 outline-none focus:border-emerald-400 transition";

  const loadRoutes = async () => {
    try {
      const res = await routeService.listRoutes(true);
      setRoutes(res.routes || []);
      if (res.routes && res.routes.length > 0) {
        setSelectedRoute(res.routes[0]);
      }
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  useEffect(() => {
    loadRoutes();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
      }
    };
    // eslint-disable-next-line
  }, []);

  const startSingleScan = async () => {
    setScanResult(null);
    setError('');
    setCameraPermissionError('');
    setIsScannerActive(true);

    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch {}
    }

    html5QrCodeRef.current = new Html5Qrcode("reader");
    const config = {
      fps: 12,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current.clear();
              setIsScannerActive(false);
            })
            .catch(() => {});
          await handleScanSuccess(decodedText);
        },
        () => {}
      );
    } catch {
      setCameraPermissionError(
        'Camera access was denied or not available. Please enable camera and try again.'
      );
      setIsScannerActive(false);
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          await html5QrCodeRef.current.clear();
        } catch {}
      }
    }
  };

  const handleScanSuccess = async (qrId) => {
    if (loading) return;

    try {
      setLoading(true);
      setError('');
      setScanResult(null);

      const routeId = selectedRoute?.id || null;
      const res = await qrService.verifyQR(qrId, routeId);

      setScanResult({
        qrId,
        ...res,
      });

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to verify QR code');
      setLoading(false);
    }
  };

  // Modern status UI
  const renderStatusDisplay = () => {
    if (loading) {
      return (
        <div className="bg-slate-900 border-4 border-emerald-400 rounded-2xl shadow-xl p-8 text-center animate-pulse">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500 mb-5 border-opacity-80"></div>
            <span className="font-bold text-emerald-200 text-2xl">Verifying QR code...</span>
            <span className="text-slate-100 mt-1 text-xs">Hold steady, processing scan</span>
          </div>
        </div>
      );
    }
    if (cameraPermissionError) {
      return (
        <div className="bg-rose-950/80 border-2 border-rose-700 rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-4 text-5xl">📷</div>
          <div className="font-bold text-rose-400 text-xl mb-2">Camera Access Denied</div>
          <p className="text-rose-200">{cameraPermissionError}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-rose-900/90 border-2 border-rose-500 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-2">⛔</div>
          <div className="font-bold text-rose-100 text-xl mb-2">Error</div>
          <p className="text-rose-200">{error}</p>
        </div>
      );
    }
    if (scanResult) {
      const { valid, user, pass, ticket, message } = scanResult;
      return (
        <div
          className={`rounded-3xl shadow-2xl overflow-hidden border-4 ${
            valid
              ? 'border-emerald-600'
              : 'border-rose-600'
          }`}
        >
          <div
            className={`px-8 pt-8 pb-5 text-white ${
              valid
                ? 'bg-gradient-to-r from-emerald-700/85 to-cyan-700/80'
                : 'bg-gradient-to-r from-rose-900/90 to-red-700/80'
            }`}
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">{valid ? '✅' : '⛔'}</span>
              <div>
                <div className="uppercase tracking-widest text-xs opacity-60 mb-1">
                  QR Scan Status
                </div>
                <div className="font-black text-2xl mb-1">
                  {valid ? 'Verified' : 'Invalid'}
                </div>
                <div className="text-xs opacity-90">{message}</div>
              </div>
            </div>
          </div>
          {user && (
            <div className="bg-white py-6 px-8">
              <div className="flex gap-5 items-center mb-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 border-2 border-gray-200">
                  <img
                    src={resolvePhoto(user.photo, user.fullName)}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=3b82f6&color=fff&size=128`;
                    }}
                  />
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-900">{user.fullName || 'Unknown'}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.roleType && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-900 border border-slate-300">{user.roleType}</span>
                    )}
                    {user.classOrPosition && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-900 border border-slate-300">{user.classOrPosition}</span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${valid ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
                      {valid ? "Verified" : "Invalid"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-sm mt-3">
                {user.idNumber && (
                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-1">ID Number</p>
                    <p className="font-semibold text-gray-800">{user.idNumber}</p>
                  </div>
                )}
                {user.schoolName && (
                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-1">School/Dept</p>
                    <p className="font-semibold text-gray-800">{user.schoolName}</p>
                  </div>
                )}
                {user.phone && (
                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-1">Phone</p>
                    <p className="font-semibold text-gray-800">{user.phone}</p>
                  </div>
                )}
                {user.guardianPhone && (
                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-1">Guardian</p>
                    <p className="font-semibold text-gray-800">{user.guardianPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {(valid && pass) || (valid && ticket) ? (
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex flex-wrap gap-5 text-sm">
              {pass && (
                <div className="min-w-[160px]">
                  <p className="text-gray-500 uppercase text-xs mb-1">Pass</p>
                  <p className="font-semibold text-gray-900">{pass.type}</p>
                  <p className="text-gray-400 text-xs">Valid till {new Date(pass.endDate).toLocaleDateString()}</p>
                </div>
              )}
              {ticket && (
                <div className="min-w-[160px]">
                  <p className="text-gray-500 uppercase text-xs mb-1">Ticket</p>
                  <p className="font-semibold text-gray-900">{ticket.type}</p>
                  <p className="text-gray-400 text-xs">Valid till {new Date(ticket.validUntil).toLocaleString()}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      );
    }
    return (
      <div className="bg-slate-800 border-4 border-slate-700 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-2 text-4xl text-slate-100/70">📱</div>
        <div className="text-xl font-bold text-slate-50 mb-1">Ready to Scan</div>
        <div className="text-sm text-slate-300 opacity-90">
          Press <span className="font-bold text-slate-100/95">Scan QR</span> to begin scanning tickets & passes.
        </div>
      </div>
    );
  };

  // UI
  return (
    <div className={`${bgMain} min-h-screen p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="py-8 text-center">
          <h1 className="text-4xl font-black text-center bg-gradient-to-br from-emerald-400 via-blue-200 to-emerald-100 bg-clip-text text-transparent mb-1 tracking-tight drop-shadow-lg">
            Conductor QR Validation
          </h1>
          <p className="text-slate-200/80 font-medium text-base tracking-wide mb-2">
            Fast realtime scanning for tickets & passes
          </p>
        </div>

        <div className={`${card} bg-gradient-to-tr from-slate-900/90 to-slate-800/90 mb-8 p-5 flex flex-col md:flex-row md:items-end gap-6`}>
          <div className="w-full md:w-2/3">
            <label className="block text-sm uppercase tracking-widest text-slate-300 mb-2 font-semibold">
              Route selection
            </label>
            <select
              value={selectedRoute?.id || ''}
              onChange={e => {
                const route = routes.find(r => r.id === parseInt(e.target.value));
                setSelectedRoute(route);
              }}
              className={`${inputStyle} w-full text-lg`}
            >
              {routes.map(route => (
                <option key={route.id} value={route.id}>                  
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3 flex flex-col">
            <button
              className={`w-full px-8 py-4 text-xl rounded-2xl font-bold transition ${scanBtn} shadow-xl ${
                isScannerActive || loading ? 'opacity-60 pointer-events-none' : ''
              }`}
              onClick={startSingleScan}
              disabled={isScannerActive || loading}
              data-testid="scan-btn"
            >
              <span className="flex items-center justify-center gap-2">
                <span role="img" aria-label="scan">📷</span> Scan QR
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch mb-6">
          {/* Scanner area */}
          <div className={`${card} bg-gradient-to-tr from-white/80 to-slate-100/80 p-0 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_45%_20%,rgba(16,185,129,0.10)_0%,_transparent_80%)] pointer-events-none" />
            <div className="w-full flex-1 flex items-center justify-center relative z-10">
              <div
                ref={readerRef}
                id="reader"
                className={`transition-all duration-300 ${
                  isScannerActive ? 'opacity-100 max-h-[330px]' : 'opacity-30 grayscale max-h-0 overflow-hidden'
                }`}
                style={{
                  width: isScannerActive ? 320 : 0,
                  margin: 'auto',
                  minHeight: isScannerActive ? 320 : 0,
                }}
              />
              {!isScannerActive && (
                <div className="absolute m-auto left-0 right-0 text-slate-400 opacity-80 flex flex-col items-center justify-center pointer-events-none text-center" style={{ minHeight: 320 }}>
                  <span className="text-7xl mb-3">📱</span>
                  <span className="text-lg font-semibold">Tap Scan QR to enable camera</span>
                </div>
              )}
            </div>
            {isScannerActive && (
              <div className="w-full flex justify-center mt-4 relative z-10">
                <span className="inline-block text-slate-600 text-sm bg-emerald-100 border border-emerald-300 rounded-full px-5 py-2 font-semibold shadow">
                  Scanning... Point camera at passenger QR
                </span>
              </div>
            )}
          </div>
          {/* Status display modernized */}
          <div className="flex items-center justify-center">{renderStatusDisplay()}</div>
        </div>

        <div className={`${card} bg-gradient-to-br from-emerald-700/90 to-emerald-800/80 shadow-md p-6 text-center mb-8`}>
          <p className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
            <span role="img" aria-label="info">💡</span>
            Instructions
          </p>
          <p className="text-slate-100 text-base opacity-90 font-medium max-w-2xl mx-auto">
            Select a route, then click <span className="font-semibold text-white">Scan QR</span>. The camera will activate—point it at the QR code of the passenger. The system will automatically verify and highlight all passenger details, including profile, pass status, and ticket.
          </p>
        </div>
      </div>
    </div>
  );
}
