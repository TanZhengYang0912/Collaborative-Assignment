const BASE =
  "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[2000] mx-auto w-fit max-w-[90vw] " +
  "break-words rounded-[10px] px-5 py-2.5 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,.3)] " +
  "sm:left-auto sm:right-5 sm:mx-0";

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div role="status" className={toast.isError ? `${BASE} bg-danger` : `${BASE} bg-ink`}>
      {toast.msg}
    </div>
  );
}
