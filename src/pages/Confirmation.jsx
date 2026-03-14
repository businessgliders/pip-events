import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { CheckCircle } from 'lucide-react';

export default function Confirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const name = state?.name || 'there';
  const email = state?.email || '';
  const eventType = state?.eventType || 'your event';

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center">
        <div className="rounded-2xl p-10 w-full text-center" style={{background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.6)',boxShadow:'0 12px 48px rgba(241,136,155,0.12)'}}>
          <div className="w-16 h-16 rounded-full bg-pink-50 border-2 border-pink-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-pink-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-500 text-sm mb-2">Your event request has been submitted successfully.</p>
          <p className="text-gray-400 text-sm mb-6">
            We've received your event request and will review it carefully. Our team will get back to you within 24 hours to discuss availability and next steps.
          </p>
          {email && (
            <p className="text-xs text-gray-400 mb-8 bg-pink-50 rounded-xl px-4 py-3 border border-pink-100">
              A confirmation email has been sent to <strong className="text-pink-500">{email}</strong>
            </p>
          )}
          <button
            onClick={() => navigate('/RequestForm')}
            className="bg-pink-400 hover:bg-pink-500 text-white px-8 py-2.5 rounded-full font-medium text-sm transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    </div>
  );
}