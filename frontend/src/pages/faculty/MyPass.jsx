import { useState, useEffect, useRef } from 'react';
import { passService } from '../../services/passService';
import { paymentService } from '../../services/paymentService';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../../components/Sidebar';

export default function MyPass() {
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('select'); // 'select', 'payment', 'upload'
  const [selectedType, setSelectedType] = useState(null);
  const [upiData, setUpiData] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadPass();
    loadUPIQR();
  }, []);

  const loadPass = async () => {
    try {
      const res = await passService.getUserPass();
      setPass(res.pass);
      if (res.pass && res.pass.status === 'PENDING') {
        // Check if payment proof is already uploaded
        if (res.payment && !res.payment.proofUrl) {
          setStep('payment');
          setSelectedType(res.pass.type);
        } else if (res.payment && res.payment.proofUrl) {
          setStep('upload');
        }
      }
    } catch (err) {
      console.error('Error loading pass:', err);
    } finally {
      setLoading(false);
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

  const handleSelectPass = async (type) => {
    try {
      setCreating(true);
      setError('');
      setSuccess('');
      setSelectedType(type);
      
      const res = await passService.createPass(type);
      setPass(res.pass);
      setStep('payment');
    } catch (err) {
      setError(err.message || 'Failed to create pass');
    } finally {
      setCreating(false);
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

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      // Use file if available, otherwise fallback to base64 URL
      await passService.uploadPaymentProof(pass.id, proofFile || proofUrl, paymentReference);
      setSuccess('Payment proof uploaded successfully! Manager will verify and approve your pass.');
      await loadPass();
      setStep('select');
      // Reset file state
      setProofFile(null);
      setProofUrl('');
    } catch (err) {
      setError(err.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 flex">
        <Sidebar role="faculty" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const amount = selectedType === 'MONTHLY' ? 500 : selectedType === 'YEARLY' ? 5000 : 0;
  const generateUPIString = (amount) => {
    if (!upiData) return '';
    return `upi://pay?pa=${upiData.upiId}&pn=${encodeURIComponent(upiData.merchantName)}&am=${amount}&cu=INR`;
  };
  const upiQRString = upiData && amount > 0 ? generateUPIString(amount) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 flex">
      <Sidebar role="faculty" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent mb-2">
            My Pass
          </h1>
          <p className="text-gray-600">Purchase and manage your bus pass</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Step 1: Select Pass Type */}
        {step === 'select' && !pass && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Get a Bus Pass</h2>
              <p className="text-gray-600">Choose a monthly or yearly pass for unlimited travel on all routes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Monthly Pass</h3>
                  <p className="text-4xl font-black text-blue-600 mb-2">₹500</p>
                  <p className="text-sm text-gray-600 mb-6">Valid for 30 days</p>
                  <button
                    onClick={() => handleSelectPass('MONTHLY')}
                    disabled={creating}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Select Monthly Pass'}
                  </button>
                </div>
              </div>

              <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-green-200 transition">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Yearly Pass</h3>
                  <p className="text-4xl font-black text-green-600 mb-2">₹5,000</p>
                  <p className="text-sm text-gray-600 mb-6">Valid for 365 days</p>
                  <button
                    onClick={() => handleSelectPass('YEARLY')}
                    disabled={creating}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Select Yearly Pass'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Show UPI QR Code */}
        {step === 'payment' && pass && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-3xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Make Payment</h2>
              <p className="text-gray-600">Scan the QR code below to pay using UPI</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 mb-6">
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-800 mb-1">Amount to Pay</p>
                <p className="text-5xl font-black text-blue-600">₹{amount}</p>
                <p className="text-sm text-gray-600 mt-2">{selectedType} Pass</p>
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
        {step === 'upload' && pass && (
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
                          fileInputRef.current?.click();
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600 mb-2">Click to upload payment receipt</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
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
                  placeholder="Transaction ID or UPI Reference Number"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('payment')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleUploadProof}
                  disabled={!proofUrl || uploading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Submit Payment Proof'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pass Details View */}
        {pass && step === 'select' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Pass Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Pass Code</p>
                <p className="text-xl font-bold font-mono text-gray-800">{pass.passCode}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="text-xl font-bold text-gray-800">{pass.type}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    pass.status === 'ACTIVE'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : pass.status === 'PENDING'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {pass.status}
                </span>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                <p className="text-xl font-bold text-gray-800">{new Date(pass.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            {pass.status === 'PENDING' && (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <p className="text-yellow-800 font-semibold">
                  ⏳ Your pass request is pending approval from the manager. You'll be notified once it's approved.
                </p>
              </div>
            )}

            {pass.status === 'ACTIVE' && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                <p className="text-green-800 font-semibold">
                  ✅ Your pass is active and valid for travel!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
