import { QRCodeSVG } from 'qrcode.react';

export default function QRDisplay({ qrCode, qrId, status, profile }) {
  const getStatusBadge = () => {
    const statusConfig = {
      ACTIVE: { 
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500', 
        text: 'text-white', 
        label: 'Active Pass',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      PENDING: { 
        bg: 'bg-gradient-to-r from-yellow-400 to-orange-400', 
        text: 'text-white', 
        label: 'Pending Pass',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      INACTIVE: { 
        bg: 'bg-gray-300', 
        text: 'text-gray-700', 
        label: 'Inactive Pass',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      },
      NO_PASS: { 
        bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
        text: 'text-white', 
        label: 'No Pass',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
    };
    const config = statusConfig[status] || statusConfig.NO_PASS;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {qrId ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white p-6 rounded-2xl shadow-2xl border-4 border-gray-100">
              <QRCodeSVG
                value={qrId}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <div className="text-center space-y-3 w-full">
            {profile && (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <p className="text-xl font-bold text-gray-800 mb-1">{profile.fullName}</p>
                {profile.idNumber && (
                  <p className="text-sm text-gray-600 font-medium">ID: {profile.idNumber}</p>
                )}
                {profile.classOrPosition && (
                  <p className="text-sm text-gray-500 mt-1">{profile.classOrPosition}</p>
                )}
              </div>
            )}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1 font-semibold">QR ID</p>
              <p className="text-sm text-gray-700 font-mono font-semibold">{qrId}</p>
            </div>
            {getStatusBadge()}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="w-20 h-20 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No QR code available</p>
        </div>
      )}
    </div>
  );
}
