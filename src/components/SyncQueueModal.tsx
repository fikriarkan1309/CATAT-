import React from 'react';
import { X, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, Database } from 'lucide-react';
import { SyncQueueItem } from '../types/finance';
import { formatTimeIndo } from '../lib/formatters';

interface SyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: SyncQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onClearSynced: () => void;
}

export const SyncQueueModal: React.FC<SyncQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  isOnline,
  isSyncing,
  onTriggerSync,
  onClearSynced,
}) => {
  if (!isOpen) return null;

  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const syncedCount = queue.filter((i) => i.status === 'synced').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Antrean Sinkronisasi (Sync Queue)
              </h3>
              <p className="text-xs text-slate-500">
                Log mutasi lokal IndexedDB sebelum di-push ke Supabase PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{pendingCount} Menunggu</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{syncedCount} Berhasil Sync</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {syncedCount > 0 && (
              <button
                onClick={onClearSynced}
                className="px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Bersihkan Riwayat</span>
              </button>
            )}

            <button
              onClick={onTriggerSync}
              disabled={isSyncing || !isOnline}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {queue.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">
                Semua Data Tersinkronisasi Sempurna
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Setiap transaksi yang Anda tambahkan saat offline akan dicatat di antrean ini dan otomatis dikirim saat koneksi pulih.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                        item.operation === 'INSERT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.operation === 'UPDATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.operation}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      tabel: <code className="text-blue-600">{item.entityTable}</code>
                    </span>
                    <span className="text-xs text-slate-400 font-mono truncate max-w-[140px]">
                      id: {item.entityId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatTimeIndo(item.clientTimestamp)}
                    </span>
                    {item.status === 'pending' && (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                    {item.status === 'syncing' && (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        Syncing
                      </span>
                    )}
                    {item.status === 'synced' && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Synced
                      </span>
                    )}
                  </div>
                </div>

                {/* Payload snippet preview */}
                <div className="bg-slate-900 text-slate-200 rounded-lg p-2.5 text-[11px] font-mono overflow-x-auto">
                  <pre>{JSON.stringify(item.payload, null, 2)}</pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Strategi: Last-Write-Wins (LWW) + UUID v4 Klien</span>
          <span>Status Jaringan: {isOnline ? 'Online 🟢' : 'Offline 🟠'}</span>
        </div>
      </div>
    </div>
  );
};
