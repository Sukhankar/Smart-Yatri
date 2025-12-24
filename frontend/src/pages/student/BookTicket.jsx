import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeService } from '../../services/routeService';
import { ticketService } from '../../services/ticketService';
import { paymentService } from '../../services/paymentService';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../../components/Sidebar';

export default function BookTicket() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [step, setStep] = useState('select'); // 'select', 'payment', 'upload'
  const [ticket, setTicket] = useState(null);
  const [payment, setPayment] = useState(null);
  const [upiData, setUpiData] = useState(null);
  const [upiQRString, setUpiQRString] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRoutes();
    loadUPIQR();
  }, []);

  useEffect(() => {
    if (upiData && payment) {
      const qrString = upiData.generateQR(payment.amount);
      setUpiQRString(qrString);
    }
  }, [upiData, payment]);

  const loadRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const res = await routeService.listRoutes(true);
      setRoutes(res.routes || []);
    } catch (err) {
      console.error('Error loading routes:', err);
      setError('Failed to load routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const loadUPIQR = async () => {
    try {
      const res = await paymentService.getUPIQR();
      setUpiData(res.upi);
    } catch (err) {
      console.error('Error loading UPI QR:', err);
    }
  };

  const handlePurchase = async () => {
    if (!selectedRoute) {
      setError('Please select a route');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await ticketService.createTicket(selectedRoute.id, 'DAILY');
      setTicket(res.ticket);
      setPayment(res.payment);
      setStep('payment');
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Store the file object for upload
      setProofFile(file);
      // Also create preview URL for display
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile && !proofUrl) {
      setError('Please upload payment receipt screenshot');
      return;
    }

    if (!ticket) {
      setError('Ticket not found');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      // Use file if available, otherwise fallback to base64 URL
      await ticketService.uploadPaymentProof(ticket.id, proofFile || proofUrl, paymentReference);
      setSuccess('Payment proof uploaded successfully! Manager will verify and approve your ticket.');
      setTimeout(() => {
        navigate('/student/my-tickets');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      <Sidebar role="student" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
            Buy Ticket
          </h1>
          <p className="text-gray-600">
            {step === 'select' && 'Purchase a daily bus ticket. Select a route below.'}
            {step === 'payment' && 'Make payment for your ticket using UPI'}
            {step === 'upload' && 'Upload payment receipt to complete your ticket purchase'}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Step 1: Select Route */}
          {step === 'select' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 md:p-8 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </span>
              Select Route
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {loadingRoutes ? (
              <div className="w-full py-20 flex justify-center items-center">
                <div>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-center text-gray-600">Loading routes...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className={`p-5 border-2 rounded-xl cursor-pointer group transition-all flex flex-col justify-between h-full min-h-[130px] ${
                        selectedRoute?.id === route.id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50/60 to-cyan-50/70 shadow-xl scale-[1.03]'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/40'
                      }`}
                      onClick={() => setSelectedRoute(route)}
                      role="button"
                      tabIndex={0}
                      aria-selected={selectedRoute?.id === route.id}
                      onKeyPress={e => {
                        if (e.key === 'Enter') setSelectedRoute(route);
                      }}
                    >
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center mb-1">
                          <span>{route.name}</span>
                          {selectedRoute?.id === route.id && (
                            <svg className="w-5 h-5 text-blue-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          Stops: {Array.isArray(route.stops) ? route.stops.join(' → ') : 'N/A'}
                        </p>
                        {Array.isArray(route.scheduleTime) && route.scheduleTime.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Schedule: {route.scheduleTime.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end mt-4">
                        <p className="text-lg font-bold text-blue-600">₹50</p>
                        <p className="text-xs text-gray-500">Daily Ticket</p>
                      </div>
                    </div>
                  ))}
                </div>
                {routes.length === 0 && (
                  <div className="text-gray-500 text-center py-10 text-base">
                    No routes available
                  </div>
                )}
              </>
            )}

            {/* Ticket purchase summary & action */}
            <div
              className={`transition-all duration-300 ${
                selectedRoute ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {selectedRoute && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    <div>
                      <p className="text-gray-600">Selected Route</p>
                      <p className="text-lg font-semibold">{selectedRoute.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₹50</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg
                      bg-gradient-to-r from-blue-600 to-cyan-600 text-white
                      hover:from-blue-700 hover:to-cyan-700
                      disabled:opacity-60 disabled:cursor-not-allowed
                    `}
                  >
                    {loading ? 'Processing...' : 'Purchase Ticket'}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Step 2: Show UPI QR Code */}
          {step === 'payment' && ticket && payment && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-3xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Make Payment</h2>
                <p className="text-gray-600">Scan the QR code below to pay using UPI</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 mb-6">
                <div className="text-center mb-6">
                  <p className="text-2xl font-bold text-gray-800 mb-1">Amount to Pay</p>
                  <p className="text-5xl font-black text-blue-600">₹{payment.amount}</p>
                  <p className="text-sm text-gray-600 mt-2">Daily Ticket - {ticket.routeName}</p>
                </div>

                {upiQRString && (
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl">
                      <QRCodeSVG
                        value={upiQRString}
                        size={280}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                )}

                {upiData && (
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 mb-1">UPI ID</p>
                    <p className="text-lg font-bold text-gray-800 font-mono">{upiData.upiId}</p>
                    <p className="text-sm text-gray-500 mt-1">{upiData.merchantName}</p>
                  </div>
                )}

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
                  <p className="text-sm text-yellow-800 font-semibold">
                    ⚠️ After making payment, please take a screenshot of the payment receipt and proceed to the next step.
                  </p>
                </div>

                <button
                  onClick={() => setStep('upload')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg"
                >
                  I've Made the Payment - Upload Receipt
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Payment Proof */}
          {step === 'upload' && ticket && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-3xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Upload Payment Receipt</h2>
                <p className="text-gray-600">Upload a screenshot of your UPI payment receipt</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Receipt Screenshot <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition">
                    {proofUrl ? (
                      <div className="space-y-4">
                        <img
                          src={proofUrl}
                          alt="Payment receipt"
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <button
                          onClick={() => {
                            setProofUrl('');
                            setProofFile(null);
                            fileInputRef.current?.click();
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Click to upload payment receipt
                        </button>
                        <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Transaction ID or Reference Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('payment')}
                    className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUploadProof}
                    disabled={uploading || !proofUrl}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Receipt'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
