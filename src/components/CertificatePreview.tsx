import { CertificateData } from '../types/certificate';
import { Download, FileText } from 'lucide-react';

interface CertificatePreviewProps {
  data: CertificateData;
}

export function CertificatePreview({ data }: CertificatePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print:hidden bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText size={24} />
          Certificate Preview
        </h2>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Download size={18} />
          Download PDF
        </button>
      </div>

      <div id="certificate" className="overflow-auto bg-gray-100 p-4">
        <div className="mx-auto bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '0' }}>
          <div className="px-12 py-8 border-b-2 border-black flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText size={32} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">KENYA REVENUE</span>
                <span className="text-sm font-bold leading-tight">AUTHORITY</span>
                <span className="text-xs mt-1">www.kra.go.ke</span>
              </div>
            </div>

            <div className="bg-gray-300 px-6 py-3 flex-1 mx-4 text-center">
              <h2 className="text-lg font-bold">PIN Certificate</h2>
            </div>

            <div className="text-right text-xs flex-shrink-0 w-32">
              <p className="font-bold text-xs">For General Tax Questions</p>
              <p className="font-bold text-xs">Contact KRA Call Centre</p>
              <p className="mt-1 text-xs">Tel: +254 (020) 4999 999</p>
              <p className="text-xs">Cell: +254(0711)099 999</p>
              <p className="text-xs">Email: callcentre@kra.go.ke</p>
              <p className="text-xs">www.kra.go.ke</p>
            </div>
          </div>

          <div className="px-12 py-6 text-xs">
            <div className="flex justify-end mb-4">
              <div className="text-right">
                <p><span className="font-bold">Certificate Date :</span> {data.certificateDate}</p>
                <p className="font-bold mt-3">Personal Identification Number</p>
                <p className="font-bold text-sm">{data.pin}</p>
              </div>
            </div>

            <div className="border-t-2 border-black mb-4"></div>

            <p className="text-center text-xs mb-6 leading-relaxed">
              This is to certify that taxpayer shown herein has been registered with Kenya Revenue Authority
            </p>

            <h3 className="text-sm font-bold text-center mb-3">Taxpayer Information</h3>

            <table className="w-full border border-black mb-4 text-xs">
              <tbody>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black border-b border-black w-1/3">Taxpayer Name</td>
                  <td className="p-2 border-b border-black">{data.taxpayerName}</td>
                </tr>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black">Email Address</td>
                  <td className="p-2">{data.emailAddress}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-sm font-bold text-center mb-3">Registered Address</h3>

            <table className="w-full border border-black mb-4 text-xs">
              <tbody>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black border-b border-black w-1/2">
                    L.R. Number :
                  </td>
                  <td className="p-2 border-b border-black">
                    <span className="font-bold">Building</span> {data.building}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black border-b border-black">
                    Street/Road <span className="font-normal">{data.streetRoad}</span>
                  </td>
                  <td className="p-2 border-b border-black">
                    <span className="font-bold">City/Town :</span> {data.cityTown}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black border-b border-black">
                    County : <span className="font-normal">{data.county}</span>
                  </td>
                  <td className="p-2 border-b border-black">
                    <span className="font-bold">District</span> {data.district}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black border-b border-black">
                    Tax Area <span className="font-normal">{data.taxArea}</span>
                  </td>
                  <td className="p-2 border-b border-black">
                    <span className="font-bold">Station</span> {data.station}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold p-2 bg-gray-100 border-r border-black">
                    P. O. Box <span className="font-normal">{data.poBox}</span>
                  </td>
                  <td className="p-2">
                    <span className="font-bold">Postal Code</span> {data.postalCode}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-sm font-bold text-center mb-3">Tax Obligation(s) Registration</h3>

            <table className="w-full border border-black mb-4 text-xs">
              <thead>
                <tr>
                  <th className="border-r border-b border-black p-2 bg-gray-100 text-left font-bold">Sr. No.</th>
                  <th className="border-r border-b border-black p-2 bg-gray-100 text-left font-bold">Tax Obligation(s)</th>
                  <th className="border-r border-b border-black p-2 bg-gray-100 text-left font-bold">Effective From Date</th>
                  <th className="border-r border-b border-black p-2 bg-gray-100 text-left font-bold">Effective Till</th>
                  <th className="border-b border-black p-2 bg-gray-100 text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-black p-2">1</td>
                  <td className="border-r border-black p-2">{data.taxObligation}</td>
                  <td className="border-r border-black p-2">{data.effectiveFromDate}</td>
                  <td className="border-r border-black p-2">{data.effectiveTill}</td>
                  <td className="p-2">{data.status}</td>
                </tr>
              </tbody>
            </table>

            <div className="text-xs leading-relaxed mb-4">
              <p>
                The above PIN must appear on all your tax invoices and correspondences with Kenya Revenue Authority. Your
                accounting end date is 31st December as per the provisions stated in the Income Tax Act unless a change has
                been approved by the Commissioner-Domestic Taxes Department. The status of Tax Obligation(s) with
                'Dormant' status will automatically change to 'Active' on date mentioned in "Effective Till Date" or any
                transaction done during the period. This certificate
              </p>
            </div>

            <div className="border-t-2 border-black pt-2">
              <p className="text-xs font-bold">
                Disclaimer : This is a system generated certificate and does not require signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
