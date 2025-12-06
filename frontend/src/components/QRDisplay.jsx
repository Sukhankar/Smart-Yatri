import { QRCodeSVG } from 'qrcode.react';

export default function QRDisplay({ qrId, status, profile }) {
  const getStatusBadge = () => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active Pass' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Pass' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive Pass' },
      NO_PASS: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'No Pass' },
    };
    const config = statusConfig[status] || statusConfig.NO_PASS;
    return (
      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {qrId ? (
        <>
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <QRCodeSVG
              value={qrId}
              size={250}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">QR ID: {qrId}</p>
            {profile && (
              <div className="mb-2">
                <p className="text-lg font-semibold text-gray-800">{profile.fullName}</p>
                {profile.idNumber && (
                  <p className="text-sm text-gray-600">ID: {profile.idNumber}</p>
                )}
              </div>
            )}
            {getStatusBadge()}
          </div>
        </>
      ) : (
        <p className="text-gray-500">No QR code available</p>
      )}
    </div>
  );
}
