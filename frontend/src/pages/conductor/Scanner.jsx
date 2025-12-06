import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrService } from '../../services/qrService';
import { routeService } from '../../services/routeService';

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

  useEffect(() => {
    loadRoutes();
    // Cleanup scanner if any
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const startSingleScan = async () => {
    setScanResult(null);
    setError('');
    setCameraPermissionError('');
    setIsScannerActive(true);

    // Dispose previous scanner if exists
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch {}
    }

    // Create new scanner instance
    html5QrCodeRef.current = new Html5Qrcode("reader");
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText /*, result*/) => {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current.clear();
              setIsScannerActive(false);
            })
            .catch(() => {});
          await handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore scan failures, don't show error to user in this handler
        }
      );
    } catch (err) {
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
      // Fetch all QR-related data, not just verification
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

  const getStatusDisplay = () => {
    if (loading) {
      return (
        <div className="bg-blue-100 border-4 border-blue-500 rounded-2xl shadow p-8 text-center animate-pulse">
          <div className="flex flex-col items-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-3"></div>
            <span className="font-bold text-blue-900 text-xl">Verifying...</span>
          </div>
        </div>
      );
    }

    if (cameraPermissionError) {
      return (
        <div className="bg-red-100 border-4 border-red-500 rounded-2xl shadow p-8 text-center">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-xl font-semibold text-red-800 mb-2">Camera Access Denied</p>
          <p className="text-red-600">{cameraPermissionError}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border-4 border-red-500 rounded-2xl shadow p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-semibold text-red-800 mb-2">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      );
    }

    if (scanResult) {
      const { valid, user, pass, ticket, message } = scanResult;
      return (
        <div
          className={`border-4 rounded-2xl shadow p-8 text-center ${
            valid
              ? 'bg-green-100 border-green-500'
              : 'bg-red-100 border-red-500'
          }`}
        >
          <div className="text-6xl mb-4">{valid ? '✅' : '❌'}</div>
          <span
            className={`text-2xl font-bold mb-2 block ${
              valid ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {valid ? 'VALID' : 'INVALID'}
          </span>
          {user && (
            <div className="mt-4 text-left bg-white rounded-xl shadow p-4">
              <p className="font-semibold text-gray-800">{user.fullName}</p>
              {user.idNumber && <p className="text-sm text-gray-600">ID: {user.idNumber}</p>}
              {user.roleType && (
                <p className="text-sm text-gray-600">Type: {user.roleType}</p>
              )}
            </div>
          )}
          {valid && pass && (
            <div className="mt-2 text-left bg-white rounded-xl shadow p-4">
              <p className="text-sm font-semibold text-gray-800">Pass: {pass.type}</p>
              <p className="text-xs text-gray-600">
                Valid until: {new Date(pass.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {valid && ticket && (
            <div className="mt-2 text-left bg-white rounded-xl shadow p-4">
              <p className="text-sm font-semibold text-gray-800">Ticket: {ticket.type}</p>
            </div>
          )}
          <p className={`mt-4 text-sm ${valid ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gray-100 border-4 border-gray-300 rounded-2xl shadow p-8 text-center">
        <p className="text-xl font-semibold text-gray-600 mb-1">Ready to Scan</p>
        <p className="text-sm text-gray-500">Press the <span className="font-bold">Scan QR</span> button to begin.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center tracking-tight text-indigo-400">QR Code Professional Scanner</h1>

        {/* Route Selection */}
        <div className="mb-6 bg-gradient-to-tr from-gray-900 to-gray-700 rounded-2xl shadow p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <label className="block text-base font-semibold mb-2">Select Route</label>
            <select
              value={selectedRoute?.id || ''}
              onChange={(e) => {
                const route = routes.find((r) => r.id === parseInt(e.target.value));
                setSelectedRoute(route);
              }}
              className="w-full bg-gray-700 text-white rounded-xl p-3 border border-gray-600 text-lg focus:outline-none"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center mt-4 md:mt-0">
            <button
              className={`px-8 py-4 text-xl rounded-full font-bold transition bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg hover:from-indigo-700 hover:to-purple-700 active:scale-95 ${
                isScannerActive || loading
                  ? 'opacity-50 pointer-events-none'
                  : ''
              }`}
              onClick={startSingleScan}
              disabled={isScannerActive || loading}
              data-testid="scan-btn"
            >
              <span role="img" aria-label="qr">📷</span> Scan QR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 items-stretch">
          {/* Scanner */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-[370px]">
            {/* Scanner Render Area */}
            <div className="w-full flex-1 flex items-center justify-center">
              {/* Only show reader when scanning */}
              <div
                ref={readerRef}
                id="reader"
                className={`transition-all duration-300 ${
                  isScannerActive
                    ? 'opacity-100 max-h-[330px]'
                    : 'opacity-40 grayscale max-h-0 overflow-hidden'
                }`}
                style={{
                  width: isScannerActive ? 300 : 0,
                  margin: 'auto',
                  minHeight: isScannerActive ? 300 : 0
                }}
              />
              {!isScannerActive &&
                <div className="absolute m-auto left-0 right-0 text-gray-500 opacity-60 flex flex-col items-center justify-center pointer-events-none" style={{ minHeight: 300 }}>
                  <span className="text-5xl mb-2">📱</span>
                  <span className="text-lg">Camera will open when you click Scan QR</span>
                </div>
              }
            </div>
            {isScannerActive && (
              <div className="w-full flex justify-center mt-3">
                <span className="inline-block text-gray-700 text-sm bg-gray-200 rounded-full px-4 py-1">Scanning... Point the camera to a QR Code</span>
              </div>
            )}
          </div>
          {/* Status Display */}
          <div className="flex items-center justify-center">{getStatusDisplay()}</div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-xl shadow p-4 text-center">
          <p className="text-base">
            <strong>Instructions:</strong> Select the route, then click <span className="text-indigo-200 font-semibold">Scan QR</span>. The camera will activate; scan passenger's code <span className="font-semibold">once</span>. The system will show all details about the scanned QR below.
          </p>
        </div>
      </div>
    </div>
  );
}