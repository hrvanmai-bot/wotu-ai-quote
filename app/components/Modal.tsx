"use client";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-5">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8992a0]"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold mb-5">{title}</h3>
        {children}
      </div>
    </div>
  );
}
