import React, { useState } from 'react';
import { FileSpreadsheet, ExternalLink, Check, Copy, HelpCircle, X, QrCode, Download, PlusCircle } from 'lucide-react';
import { extractGoogleSheetId, exportQueueToCSV, downloadGoogleSheetTemplate } from '../services/googleSheets';

export default function GoogleSheetModal({ 
  isOpen, 
  onClose, 
  currentSheetId, 
  currentFormUrl,
  onSaveConfig, 
  queue, 
  currentSong 
}) {
  const [sheetUrl, setSheetUrl] = useState(
    currentSheetId ? `https://docs.google.com/spreadsheets/d/${currentSheetId}` : ''
  );
  const [formUrl, setFormUrl] = useState(currentFormUrl || '');
  const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'guide'

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const sheetId = extractGoogleSheetId(sheetUrl);
    if (!sheetId && sheetUrl.trim()) {
      alert("Please enter a valid Google Sheet URL or ID!");
      return;
    }
    onSaveConfig({
      sheetId,
      formUrl: formUrl.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-display">Google Sheets & Forms Integration</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Direct Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Collect song requests via Google Form or edit directly in a live Google Sheet.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('connect')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'connect'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              Connect Sheet & Form
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'guide'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              Setup Guide
            </button>
          </div>

          <button
            type="button"
            onClick={downloadGoogleSheetTemplate}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            title="Download CSV Template with predefined columns"
          >
            <Download className="w-3.5 h-3.5" /> Download Template CSV
          </button>
        </div>

        {activeTab === 'connect' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                Google Form Link (Target for smartphone QR code)
              </label>
              <input
                type="text"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://forms.gle/xyz123 or https://docs.google.com/forms/d/e/.../viewform"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your TV screen's QR code can point directly to this Google Form so guests need zero custom apps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Linked Google Sheet URL (Where Form responses land)
              </label>
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Ensure sharing is set to <strong className="text-emerald-400">"Anyone with the link: Viewer"</strong>. The host screen will auto-refresh requests every 4 seconds.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Open sheets.new
              </a>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
              >
                Save & Start Sync
              </button>
            </div>
          </form>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs text-slate-300 max-h-[350px] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">Step 1: Create a Google Form</h4>
              <p className="text-slate-400">Go to <a href="https://forms.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">forms.google.com</a> and create 4 standard questions:</p>
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-slate-300 font-mono text-[11px]">
                <li>1. Singer Name (Short answer)</li>
                <li>2. Song Title / YouTube Link (Short answer)</li>
                <li>3. Performance Mode (Multiple choice: "Solo" or "Open Mic")</li>
                <li>4. Key Shift (Multiple choice: "-2", "-1", "0", "+1", "+2")</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">Step 2: Link to Google Sheets</h4>
              <p className="text-slate-400">
                In your Google Form, click the <strong className="text-white">Responses</strong> tab and click <strong className="text-white">"Link to Sheets"</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">Step 3: Enable Public Viewer Access</h4>
              <p className="text-slate-400">
                In the Google Sheet, click <strong className="text-white">Share</strong> (top right), set General access to <strong className="text-emerald-400">"Anyone with the link: Viewer"</strong>, and paste the URL here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
