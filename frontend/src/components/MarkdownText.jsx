import React from 'react';

export default function MarkdownText({ text, className = "" }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        let content = line.trim();
        let Tag = 'p';
        let lineClass = 'mb-1 leading-relaxed text-sm';

        // Headers
        if (content.startsWith('### ')) {
          Tag = 'h3';
          lineClass = 'text-base font-bold mt-4 mb-2 text-text-primary';
          content = content.substring(4);
        } else if (content.startsWith('## ')) {
          Tag = 'h2';
          lineClass = 'text-lg font-bold mt-5 mb-2 text-text-primary';
          content = content.substring(3);
        } else if (content.startsWith('# ')) {
          Tag = 'h1';
          lineClass = 'text-xl font-bold mt-6 mb-3 text-text-primary';
          content = content.substring(2);
        }

        // Bullets
        if (content.startsWith('- ') || content.startsWith('* ')) {
          content = '• ' + content.substring(2);
          lineClass += ' ml-4';
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(content)) {
          lineClass += ' ml-4';
        }

        // Inline Bold / Italic
        const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/g);

        return (
          <Tag key={i} className={lineClass}>
            {parts.map((part, j) => {
              if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
                return <strong key={j} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>;
              }
              if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
                return <em key={j}>{part.slice(1, -1)}</em>;
              }
              return <span key={j}>{part}</span>;
            })}
          </Tag>
        );
      })}
    </div>
  );
}
