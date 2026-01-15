import { X, Download, Crown, ExternalLink } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isPro: boolean;
  imageName: string;
}

export function DownloadModal({ isOpen, onClose, onDownload, isPro, imageName }: DownloadModalProps) {
  if (!isOpen) return null;

  const handleDownloadClick = () => {
    onDownload();
    if (isPro) {
      onClose();
    }
    // For free users, keep modal open to show ads
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {isPro ? 'Download Your Image' : 'Free Download'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isPro ? (
            <>
              {/* Ad Placement */}
              <div className="mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-2">Advertisement</p>
                <div className="text-gray-400 text-xs">
                  [Ad space - 300x250]
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Ads help us keep this tool free
                </p>
              </div>

              {/* Free Tier Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Free Download Includes:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Resized to {imageName}</li>
                  <li>✓ Smart crop applied</li>
                  <li>⚠ Small watermark added</li>
                  <li>⚠ Standard resolution</li>
                </ul>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Crown className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Upgrade to Pro</h4>
                    <ul className="text-sm text-gray-700 space-y-1 mb-4">
                      <li>✓ HD quality downloads</li>
                      <li>✓ No watermarks</li>
                      <li>✓ Batch processing</li>
                      <li>✓ Ad-free experience</li>
                      <li>✓ Priority support</li>
                    </ul>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all">
                      <Crown className="w-4 h-4" />
                      Upgrade Now - $9.99/month
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadClick}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Continue with Free Download
              </button>
            </>
          ) : (
            <>
              {/* Pro Download */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Pro Download Ready</h4>
                <p className="text-gray-600">
                  Your high-quality image is ready to download with no watermarks.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-900 mb-2">Pro Features Applied:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ Maximum HD quality</li>
                  <li>✓ No watermark</li>
                  <li>✓ Optimized file size</li>
                  <li>✓ Professional grade output</li>
                </ul>
              </div>

              <button
                onClick={handleDownloadClick}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
              >
                <Download className="w-5 h-5" />
                Download HD Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
