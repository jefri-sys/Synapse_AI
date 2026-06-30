import * as React from "react"
import { Card } from "./card"
import { cn } from "../../lib/utils"

import { Activity } from "lucide-react"

const StatCard = React.forwardRef(({ className, label, value, trend, icon: Icon = Activity, ...props }, ref) => {
  return (
    <Card ref={ref} className={cn("flex flex-col relative justify-between gap-3 p-5", className)} {...props}>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-text-secondary">
            {label}
          </span>
          <Icon className="w-4 h-4 text-text-tertiary" />
        </div>
        <span className="text-2xl font-display font-semibold text-text-primary">
          {value}
        </span>
      </div>
      {trend && (
        <div className="pt-2 border-t border-surface-border mt-1">
          <span className="text-[13px] text-text-secondary">
            {trend}
          </span>
        </div>
      )}
    </Card>
  )
})
StatCard.displayName = "StatCard"

export { StatCard }
