import { useState } from 'react';
import { CertificateForm } from './components/CertificateForm';
import { CertificatePreview } from './components/CertificatePreview';
import { CertificateData } from './types/certificate';
import { FileText } from 'lucide-react';

function App() {
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);

  const handleGenerate = (data: CertificateData) => {
    setCertificateData(data);
    setTimeout(() => {
      const previewElement = document.getElementById('certificate');
      if (previewElement) {
        previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="print:hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <FileText size={32} className="text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">KRA PIN Certificate Generator</h1>
                <p className="text-sm text-gray-600 mt-1">Generate professional tax certificates instantly</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <CertificateForm onGenerate={handleGenerate} />
          </div>

          {certificateData && (
            <div className="mb-8">
              <CertificatePreview data={certificateData} />
            </div>
          )}
        </main>

        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-600 text-sm">
              Certificate Generator - Create professional tax documents with ease
            </p>
          </div>
        </footer>
      </div>

      {certificateData && (
        <div className="hidden print:block">
          <CertificatePreview data={certificateData} />
        </div>
      )}
    </div>
  );
}

export default App;
