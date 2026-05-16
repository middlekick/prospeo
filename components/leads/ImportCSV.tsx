"use client";

import { useState, useRef } from "react";

// Colonnes CSV reconnues → champs Lead
const COL_MAP: Record<string, string> = {
  nom: "nom", name: "nom", entreprise: "nom", company: "nom",
  metier: "metier", activite: "metier", category: "metier",
  telephone: "telephone", tel: "telephone", phone: "telephone",
  site: "site", website: "site", url: "site",
  emplacement: "emplacement", adresse: "emplacement", ville: "emplacement", address: "emplacement",
  pays: "pays", country: "pays",
  tag: "tag", statut: "tag", status: "tag",
  rappel: "rappel",
  note: "note", notes: "note",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Détecte le séparateur (;  ou ,)
  const sep = lines[0].includes(";") ? ";" : ",";

  const rawHeaders = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const headers    = rawHeaders.map(h => COL_MAP[h] || h);

  return lines.slice(1).map(line => {
    const values = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { if (h) row[h] = values[i] || ""; });
    return row;
  });
}

interface Props {
  onClose: () => void;
  onImported: () => void;
}

export default function ImportCSV({ onClose, onImported }: Props) {
  const [rows,    setRows]    = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text   = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setMsg(null);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function doImport() {
    if (!rows?.length) return;
    setLoading(true);
    setMsg(null);
    try {
      const res  = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Message clair si plan free
        if (data.error === "upgrade_required") {
          throw new Error("L'import CSV est réservé au plan Pro. Passez Pro sur /#pricing.");
        }
        throw new Error(data.error || "Erreur import");
      }
      setMsg({ text: `✓ ${data.added} lead(s) importé(s) (doublons ignorés)`, ok: true });
      setTimeout(onImported, 1200);
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#0f1117] border border-white/10 rounded-xl w-full max-w-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-slate-200">Importer des leads (CSV)</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 text-sm flex items-center justify-center">✕</button>
          </div>

          <div className="p-5 space-y-4">
            {/* Info colonnes */}
            <div className="rounded-lg bg-white/3 border border-white/8 p-3 text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-400">Colonnes reconnues automatiquement :</p>
              <p>nom / entreprise · téléphone / phone · métier / activité · site / website</p>
              <p>emplacement / adresse / ville · pays · tag · rappel (YYYY-MM-DD) · note</p>
              <p className="text-slate-600">Séparateur ; ou , · Encodage UTF-8 · En-têtes en 1ère ligne</p>
            </div>

            {/* Input fichier */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
            >
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
              <p className="text-sm text-slate-400">Cliquer pour choisir un fichier CSV</p>
              <p className="text-xs text-slate-600 mt-1">.csv ou .txt</p>
            </div>

            {/* Prévisualisation */}
            {rows && rows.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">{rows.length} ligne(s) détectée(s) — aperçu :</p>
                <div className="overflow-x-auto rounded-lg border border-white/8">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/8">
                        {Object.keys(rows[0]).map(k => (
                          <th key={k} className="px-3 py-2 text-left text-slate-500 font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-2 text-slate-400 max-w-[120px] truncate">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 3 && (
                    <p className="px-3 py-2 text-xs text-slate-600">… et {rows.length - 3} autres lignes</p>
                  )}
                </div>
              </div>
            )}

            {msg && (
              <p className={["text-xs mono", msg.ok ? "text-green-400" : "text-red-400"].join(" ")}>{msg.text}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/8">
            <button onClick={onClose} className="px-4 py-1.5 rounded-md text-xs text-slate-400 hover:bg-white/5">Annuler</button>
            <button
              onClick={doImport}
              disabled={!rows?.length || loading}
              className="px-4 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-xs font-medium text-white transition-colors"
            >
              {loading ? "Import…" : `Importer ${rows?.length ?? 0} ligne(s)`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
