const fs = require('fs');
const path = 'd:/Synapse/frontend/src/components/messaging/CallOverlay.jsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the main wrapper
code = code.replace(
  /return \(\n\s*<div className=\{\`fixed inset-0 z-\[100\] flex items-center justify-center bg-black\/40 backdrop-blur-md \$\{isVideoConnected \? 'bg-black\/90' : ''\}\`\}>\n\s*<div className=\{\`relative flex flex-col items-center overflow-hidden shadow-2xl \$\{\n\s*isVideoConnected \n\s*\? 'w-full max-w-4xl h-\[80vh\] p-0 rounded-none md:rounded-3xl bg-black' \n\s*: 'bg-white rounded-3xl p-8 w-80'\n\s*\}\`\}>/,
  `return (
    <div className={\`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-300 \${callStatus === 'idle' ? 'opacity-0' : 'opacity-100'}\`}>
      <div className={\`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 \${(isMinimized || (callStatus === 'calling' || callStatus === 'receiving')) ? 'opacity-0 pointer-events-none' : 'opacity-100'} \${isVideoConnected ? 'bg-black/90' : ''}\`} />
      <div className={\`
        \${(callStatus === 'calling' || callStatus === 'receiving')
          ? 'fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-2xl shadow-xl flex flex-row items-center justify-between p-4 pointer-events-auto bg-surface-base border border-surface-border animate-in slide-in-from-top-4' 
          : 'relative flex flex-col items-center overflow-hidden shadow-2xl pointer-events-auto bg-surface-base rounded-3xl p-8 w-80'
        }
        \${isVideoConnected ? '!w-full !max-w-4xl !h-[80vh] !p-0 !rounded-none md:!rounded-3xl bg-black' : ''}
        \${isMinimized ? 'fixed !bottom-24 !right-4 !w-48 !p-4 !top-auto !left-auto scale-100 translate-y-0' : ''}
        \${callStatus === 'idle' ? 'scale-95 translate-y-4 opacity-0 pointer-events-none' : 'opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] scale-100 translate-y-0'}
      \`}>`
);

// Replace calling block
code = code.replace(
  /\{callStatus === 'calling' && \(\n\s*<>\n\s*<div className="relative mb-6 w-32 h-32 flex items-center justify-center">\n\s*<div className="absolute inset-0 bg-brand-primary\/20 rounded-full animate-ping" style=\{\{ animationDuration: '3s' \}\}\><\/div>\n\s*<div className="absolute inset-2 bg-brand-primary\/30 rounded-full animate-ping" style=\{\{ animationDuration: '2s' \}\}\><\/div>\n\s*<div className="absolute inset-4 bg-brand-primary\/40 rounded-full animate-ping" style=\{\{ animationDuration: '1.5s' \}\}\><\/div>\n\s*<img \n\s*src=\{callerInfo\?\.avatar \|\| \`https:\/\/ui-avatars\.com\/api\/\?name=\$\{callerInfo\?\.name \|\| 'User'\}\`\} \n\s*alt="Avatar" \n\s*className="w-20 h-20 rounded-full relative z-10 object-cover border-2 border-brand-primary shadow-lg"\n\s*\/>\n\s*<\/div>\n\s*<h2 className="text-xl font-bold mb-1 text-text-primary">\{callerInfo\?\.name \|\| 'User'\}<\/h2>\n\s*<p className="text-text-secondary mb-8">Calling\.\.\.<\/p>\n\s*<Button onClick=\{endCall\} variant="danger" shape="circular" className="w-16 h-16 shadow-lg transition-transform hover:scale-105">\n\s*<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M16 8l-8 8m0-8l8 8" \/><\/svg>\n\s*<\/Button>\n\s*<\/>\n\s*\)/,
  `{callStatus === 'calling' && (
          <>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                <img 
                  src={callerInfo?.avatar || \`https://ui-avatars.com/api/?name=\${callerInfo?.name || 'User'}\`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full relative z-10 object-cover border border-surface-border shadow-sm"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-text-primary text-[15px]">{callerInfo?.name || 'User'}</span>
                <span className="text-sm text-text-secondary animate-pulse">Calling...</span>
              </div>
            </div>
            <button onClick={endCall} className="w-10 h-10 rounded-full bg-status-danger hover:bg-status-danger/90 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 ml-4 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" /></svg>
            </button>
          </>
        )}`
);

// Replace receiving block
code = code.replace(
  /\{callStatus === 'receiving' && \(\n\s*<>\n\s*<div className="relative mb-6 w-32 h-32 flex items-center justify-center">\n\s*<div className="absolute inset-0 bg-brand-primary\/20 rounded-full animate-ping" style=\{\{ animationDuration: '3s' \}\}\><\/div>\n\s*<div className="absolute inset-2 bg-brand-primary\/30 rounded-full animate-ping" style=\{\{ animationDuration: '2s' \}\}\><\/div>\n\s*<div className="absolute inset-4 bg-brand-primary\/40 rounded-full animate-ping" style=\{\{ animationDuration: '1.5s' \}\}\><\/div>\n\s*<img \n\s*src=\{callerInfo\?\.avatar \|\| \`https:\/\/ui-avatars\.com\/api\/\?name=\$\{callerInfo\?\.name \|\| 'User'\}\`\} \n\s*alt="Avatar" \n\s*className="w-20 h-20 rounded-full relative z-10 object-cover border-2 border-brand-primary shadow-lg"\n\s*\/>\n\s*<\/div>\n\s*<h2 className="text-xl font-bold mb-1 text-text-primary">\{callerInfo\?\.name \|\| 'Unknown'\}<\/h2>\n\s*<p className="text-text-secondary mb-8 animate-pulse">Incoming call\.\.\.<\/p>\n\s*<div className="flex space-x-6">\n\s*<Button onClick=\{rejectCall\} variant="danger" shape="circular" className="w-14 h-14 shadow-lg transition-transform hover:scale-105">\n\s*<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M6 18L18 6M6 6l12 12" \/><\/svg>\n\s*<\/Button>\n\s*<Button onClick=\{acceptCall\} variant="primary" shape="circular" className="w-14 h-14 bg-status-success hover:bg-status-success\/90 shadow-lg transition-transform hover:scale-105">\n\s*<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M5 13l4 4L19 7" \/><\/svg>\n\s*<\/Button>\n\s*<\/div>\n\s*<\/>\n\s*\)/,
  `{callStatus === 'receiving' && (
          <>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-status-success/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                <img 
                  src={callerInfo?.avatar || \`https://ui-avatars.com/api/?name=\${callerInfo?.name || 'User'}\`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full relative z-10 object-cover border border-surface-border shadow-sm"
                />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="font-semibold text-text-primary text-[15px] truncate max-w-[120px]">{callerInfo?.name || 'Unknown'}</span>
                <span className="text-sm text-text-secondary animate-pulse">Incoming call</span>
              </div>
            </div>
            <div className="flex space-x-2 ml-4 flex-shrink-0">
              <button onClick={rejectCall} className="w-10 h-10 rounded-full bg-status-danger hover:bg-status-danger/90 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button onClick={acceptCall} className="w-10 h-10 rounded-full bg-status-success hover:bg-status-success/90 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 animate-bounce" style={{ animationDuration: '2s' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </>
        )}`
);

fs.writeFileSync(path, code);
