import * as React from "react"
import { cn } from "../../lib/utils"
import { Sparkles, Globe } from "lucide-react"

export const ChatBubble = React.forwardRef(({ className, role = "user", searchPerformed, headerRight, children, ...props }, ref) => {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-6`}>
      <div 
        ref={ref}
        className={cn(
          "max-w-[85%] px-5 py-4 shadow-sm",
          isUser 
            ? "bg-brand-primary text-white rounded-2xl rounded-br-sm" 
            : "bg-surface-raised border border-surface-border text-text-primary rounded-2xl rounded-bl-sm",
          className
        )}
        {...props}
      >
        {!isUser && (
          <div className="flex items-center justify-between gap-4 mb-2 text-ai-accent">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-ai-accent">AI Assistant</span>
              {searchPerformed && (
                <span className="ml-2 px-2 py-0.5 bg-status-info-subtle text-status-info border border-status-info/20 rounded text-[10px] flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Searched the web
                </span>
              )}
            </div>
            {headerRight}
          </div>
        )}
        
        <div className="leading-relaxed overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
})
ChatBubble.displayName = "ChatBubble"
