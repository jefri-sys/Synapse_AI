import * as React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "../../lib/utils"

const AIAccent = React.forwardRef(({ className, children, label = "AI Insights", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-ai-accent-subtle rounded-[12px] p-5",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-ai-accent flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>
      <div className="text-text-primary text-[14px] leading-relaxed max-w-3xl">
        {children}
      </div>
    </div>
  )
})
AIAccent.displayName = "AIAccent"

export { AIAccent }
