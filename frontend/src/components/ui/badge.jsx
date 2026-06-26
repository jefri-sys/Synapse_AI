import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef(({ className, status = "info", ...props }, ref) => {
  const variants = {
    success: "bg-status-success-subtle text-status-success",
    warning: "bg-status-warning-subtle text-status-warning",
    danger: "bg-status-danger-subtle text-status-danger",
    info: "bg-status-info-subtle text-status-info",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-1 text-xs font-semibold transition-colors",
        variants[status],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
