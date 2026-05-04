import { useRef, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { serializeZwo, downloadZwo } from '../utils/zwoSerializer';
import { parseZwo } from '../utils/zwoParser';
import { buildShareUrl } from '../utils/shareUrl';

export default function ImportExport() {
  const { blocks, meta, importBlocks } = useWorkoutStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (blocks.length === 0) {
      alert('Add some blocks to your workout before sharing.');
      return;
    }
    const url = buildShareUrl(blocks, meta);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`Share URL:\n${url}`);
    }
  };

  const handleExport = () => {
    if (blocks.length === 0) {
      alert('Add some blocks to your workout before exporting.');
      return;
    }
    const xml = serializeZwo(blocks, meta);
    const filename = (meta.name || 'workout').replace(/[^a-z0-9_\- ]/gi, '_');
    downloadZwo(xml, filename);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.zwo') && !file.name.endsWith('.xml')) {
      alert('Please select a .zwo file.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const xml = ev.target?.result as string;
        const { blocks, meta } = parseZwo(xml);
        importBlocks(blocks, meta);
      } catch {
        alert('Failed to parse the ZWO file. Please check that it is a valid .zwo workout file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zwo,.xml"
        className="hidden"
        onChange={handleImport}
        aria-label="Import ZWO file"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
          bg-gray-700 text-gray-200 border border-gray-600
          hover:bg-gray-600 hover:border-gray-500 transition-colors"
        title="Import a .zwo file"
      >
        📂 Import ZWO
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
          bg-blue-700 text-white border border-blue-600
          hover:bg-blue-600 transition-colors"
        title="Copy shareable link to clipboard"
      >
        {copied ? '✅ Copied!' : '🔗 Share'}
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
          bg-orange-600 text-white border border-orange-500
          hover:bg-orange-500 transition-colors"
        title="Export as .zwo file"
      >
        💾 Export ZWO
      </button>
    </div>
  );
}
