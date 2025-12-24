import { useRef, useState } from "react";

/**
 * MakePayment
 * 
 * USAGE:
 * <MakePayment
 *    amount={number} // required, payment amount (number)
 *    upiData={object} // required, { upiId, merchantName }
 *    onNext={func} // called when user successfully proceeds to upload (after "I've Made the Payment - Upload Receipt" button)
 *    onBack={func} // optional, called when user uses a back button (from upload screen)
 *    onUpload={func} // required, async function called with (file, paymentReference)
 *    uploading={bool} // indicates uploading state
 *    error={string}
 *    success={string}
 * />
 */
export default function MakePayment({
  amount,
  upiData,
  onNext,
  onBack,
  onUpload,
  uploading,
  error,
  success,
}) {
  const [step, setStep] = useState("payment");
  const [proofUrl, setProofUrl] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");
  const fileInputRef = useRef(null);

  const upiQRString =
    upiData && amount > 0
      ? `upi://pay?pa=${upiData.upiId}&pn=${encodeURIComponent(
          upiData.merchantName
        )}&am=${amount}&cu=INR`
      : "";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!proofFile && !proofUrl) {
      alert("Please upload payment receipt screenshot");
      return;
    }
    if (onUpload) {
      await onUpload(proofFile || proofUrl, paymentReference);
    }
    setProofFile(null);
    setProofUrl("");
    setPaymentReference("");
    setStep("payment");
  };

  // Allow parent to control error/success, but may show local alerts for file issues

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-3xl mx-auto">
      {/* Step: Show UPI QR Code */}
      {step === "payment" && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Make Payment
            </h2>
            <p className="text-gray-600">
              Scan the QR code below to pay using UPI
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <p className="text-2xl font-bold text-gray-800 mb-1">
                Amount to Pay
              </p>
              <p className="text-5xl font-black text-blue-600">₹{amount}</p>
              <p className="text-sm text-gray-600 mt-2">
                {upiData ? "Bus Pass" : null}
              </p>
            </div>

            {upiQRString && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-2xl">
                  {/* Try to import QRCodeSVG, fallback to raw img */}
                  {typeof window !== "undefined" && window.QRCodeSVG ? (
                    <window.QRCodeSVG
                      value={upiQRString}
                      size={280}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                        upiQRString
                      )}`}
                      alt="UPI QR"
                      width={280}
                      height={280}
                    />
                  )}
                </div>
              </div>
            )}

            {upiData && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-1">UPI ID</p>
                <p className="text-lg font-bold text-gray-800 font-mono">
                  {upiData.upiId}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {upiData.merchantName}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ After making payment, please take a screenshot of the payment
                receipt and proceed to the next step.
              </p>
            </div>

            <button
              onClick={() => {
                setStep("upload");
                if (onNext) onNext();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg"
            >
              I've Made the Payment - Upload Receipt
            </button>
          </div>
        </div>
      )}

      {/* Step: Upload Payment Proof */}
      {step === "upload" && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Upload Payment Receipt
            </h2>
            <p className="text-gray-600">
              Upload a screenshot of your UPI payment receipt
            </p>
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
                        setProofUrl("");
                        fileInputRef.current?.click();
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-gray-600 mb-2">
                      Click to upload payment receipt
                    </p>
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
                  data-testid="payment-proof-input"
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
            {(error || success) && (
              <div
                className={`mb-2 p-3 rounded-lg ${
                  error
                    ? "bg-red-100 border-l-4 border-red-500 text-red-700 animate-fade-in"
                    : "bg-green-100 border-l-4 border-green-500 text-green-700 animate-fade-in"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        error
                          ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    />
                  </svg>
                  {error || success}
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep("payment");
                  if (onBack) onBack();
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!proofUrl || uploading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Submit Payment Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
