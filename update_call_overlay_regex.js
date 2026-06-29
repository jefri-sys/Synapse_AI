const fs = require('fs');
const file = 'd:/Synapse/frontend/src/components/messaging/CallOverlay.jsx';
let content = fs.readFileSync(file, 'utf8');

// Use regex with [\s\S]*? to handle line endings and spacing perfectly

// 1. Replace the wrapper layout
const wrapperRegex = /return \(\s*<div className=\{`fixed inset-0 z-\[100\] flex items-center justify-center bg-black\/40 backdrop-blur-md \$\{isVideoConnected \? 'bg-black\/90' : ''\}`\}>\s*<div className=\{`relative flex flex-col items-center overflow-hidden shadow-2xl \$\{[\s\S]*?isVideoConnected[\s\S]*?\? 'w-full max-w-4xl h-\[80vh\] p-0 rounded-none md:rounded-3xl bg-black'[\s\S]*?: 'bg-white rounded-3xl p-8 w-80'[\s\S]*?\}`\}>/;

const wrapperReplace = `return (
    <div className={\`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-300 \${callStatus === 'idle' ? 'opacity-0' : 'opacity-100'}\`}>
      
      {/* Backdrop ONLY for connected state, not for banner states */}
      <div className={\`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 \${(isMinimized || (callStatus === 'calling' || callStatus === 'receiving')) ? 'opacity-0 pointer-events-none' : 'opacity-100'} \${isVideoConnected ? 'bg-black/90' : ''}\`} />

      <div className={\`
        \${(callStatus === 'calling' || callStatus === 'receiving')
          ? 'fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-2xl shadow-xl flex flex-row items-center justify-between p-4 pointer-events-auto bg-surface-base border border-surface-border animate-in slide-in-from-top-4' 
          : 'relative flex flex-col items-center overflow-hidden shadow-2xl pointer-events-auto bg-surface-base rounded-3xl p-8 w-80'
        }
        \${isVideoConnected ? '!w-full !max-w-4xl !h-[80vh] !p-0 !rounded-none md:!rounded-3xl bg-black' : ''}
        \${isMinimized ? 'fixed !bottom-24 !right-4 !w-48 !p-4 !top-auto !left-auto scale-100 translate-y-0' : ''}
        \${callStatus === 'idle' ? 'scale-95 translate-y-4 opacity-0 pointer-events-none' : 'opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] scale-100 translate-y-0'}
      \`}>`;

content = content.replace(wrapperRegex, wrapperReplace);

// 2. Replace 'calling' block
const callingRegex = /\{callStatus === 'calling' && \([\s\S]*?<div className="relative mb-6 w-32 h-32 flex items-center justify-center">[\s\S]*?<\/Button>\s*<\/>\s*\)/;

const callingReplace = `{callStatus === 'calling' && (
        <div className="flex w-full items-center justify-between">
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
        </div>
      )}`;

content = content.replace(callingRegex, callingReplace);


// 3. Replace 'receiving' block
const receivingRegex = /\{callStatus === 'receiving' && \([\s\S]*?<div className="relative mb-6 w-32 h-32 flex items-center justify-center">[\s\S]*?<\/Button>\s*<\/div>\s*<\/>\s*\)/;

const receivingReplace = `{callStatus === 'receiving' && (
        <div className="flex w-full items-center justify-between">
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
        </div>
      )}`;

content = content.replace(receivingRegex, receivingReplace);

fs.writeFileSync(file, content);
console.log('Update complete using Regex line endings bypass.');
