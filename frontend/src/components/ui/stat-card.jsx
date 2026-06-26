import * as React from "react"
import { Card } from "./card"
import { cn } from "../../lib/utils"

const StatCard = React.forwardRef(({ className, label, value, trend, ...props }, ref) => {
  return (
    <Card ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
      <span className="text-xs uppercase text-text-secondary tracking-[0.04em] font-body">
        {label}
      </span>
      <span className="text-3xl font-display font-semibold text-text-primary">
        {value}
      </span>
      {trend && (
        <span className="text-sm text-text-secondary mt-1">
          {trend}
        </span>
      )}
    </Card>
  )
})
StatCard.displayName = "StatCard"

export { StatCard }
