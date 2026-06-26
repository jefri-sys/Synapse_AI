import * as React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "../../lib/utils"

const AIAccent = React.forwardRef(({ className, children, label = "AI Insights", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-ai-accent-subtle border-l-[3px] border-ai-accent rounded-md p-5",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-ai-accent" />
        <span className="text-sm font-medium text-ai-accent">{label}</span>
      </div>
      <div className="text-text-primary text-sm">
        {children}
      </div>
    </div>
  )
})
AIAccent.displayName = "AIAccent"

export { AIAccent }
