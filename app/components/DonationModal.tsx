// app/components/DonationModal.tsx
"use client";

export default function DonationModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl max-w-sm w-full text-center relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700 leading-none"
        >
          &times;
        </button>
        <h3 className="text-xl font-bold text-slate-800 mb-2">🎁 Apoyar el proyecto</h3>
        <p className="text-sm text-slate-500 mb-4">
          Esta plataforma es gratuita. Si te resulta útil, puedes invitarme a un café (o a un roscón).
        </p>

        <div className="bg-slate-100 p-4 rounded-xl mb-4 inline-block">
          <img
            src="/revo.jpg"
            alt="QR Revolut"
            className="w-48 h-48 object-contain mix-blend-multiply"
          />
        </div>

        <a
          href="https://revolut.me/kylareksas"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          Apoyar con Revolut &rarr;
        </a>
      </div>
    </div>
  );
}