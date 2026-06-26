import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Button component
 * 
 * Variants:
 * - primary: Solid brand color, used for main actions. Supports a `tone` prop:
 *     - tone="danger": var(--status-danger) background, white text (identical to variant="danger")
 * - secondary: Solid muted background, used for alternative actions.
 * - ghost: Transparent background, no border. Supports a `tone` prop:
 *     - tone="danger": var(--status-danger) text, hover var(--status-danger) at 10% opacity
 *     - (no tone): var(--text-secondary) text, hover var(--surface-sunken) and var(--text-primary)
 * - danger: Solid danger color, used for destructive actions.
 * - outline: Transparent background with a border. Supports a `tone` prop:
 *     - tone="danger": var(--status-danger) border/text, hover var(--status-danger) at 10% opacity
 *     - tone="warning": var(--status-warning) border/text, hover var(--status-warning) at 10% opacity
 *     - (no tone): var(--surface-border) border, var(--text-primary) text, hover var(--surface-sunken)
 * 
 * RULE: variant="danger" vs tone="danger"
 * - variant="danger" is the default shorthand for "a solid destructive button, standard weight."
 *   Use it whenever a destructive action just needs to look like a normal primary button, except red.
 * - Reach for tone="danger" ONLY when the destructive action specifically needs a different visual weight
 *   (i.e., you've already chosen `outline` or `ghost` for contextual reasons like blending into a list,
 *   and then need that specific weight to also carry danger meaning).
 *   `tone="danger"` on `primary` exists narrowly for modal confirmation contexts where a solid red button
 *   needs to coexist with the same visual register as a non-destructive solid primary button.
 * 
 * Shape:
 * - default: Standard rectangular button with rounded corners (h-10 px-4 rounded-md).
 * - circular: Icon-only circular button (e.g., call actions). Uses rounded-full p-3 base styling.
 *   Can combine with any existing variant (e.g., shape="circular" variant="danger" for decline,
 *   shape="circular" variant="primary" for accept). Note it is intended for icon-only content, not text labels.
 */
const Button = React.forwardRef(({ className, variant = "primary", tone, shape = "default", ...props }, ref) => {
  let baseStyles = "inline-flex items-center justify-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  if (shape === "circular") {
    baseStyles += " rounded-full p-3";
  } else {
    baseStyles += " h-10 px-4 rounded-md";
  }
  
  let primaryStyles = "bg-brand-primary text-white hover:bg-brand-primary-hover";
  if (variant === "primary" && tone === "danger") {
    primaryStyles = "bg-status-danger text-white hover:bg-status-danger/90";
  }

  let outlineStyles = "border border-surface-border bg-transparent text-text-primary hover:bg-surface-sunken";
  if (variant === "outline") {
    if (tone === "danger") {
      outlineStyles = "border border-status-danger text-status-danger bg-transparent hover:bg-status-danger/10";
    } else if (tone === "warning") {
      outlineStyles = "border border-status-warning text-status-warning bg-transparent hover:bg-status-warning/10";
    }
  }

  let ghostStyles = "bg-transparent text-text-secondary hover:bg-surface-sunken hover:text-text-primary";
  if (variant === "ghost") {
    if (tone === "danger") {
      ghostStyles = "bg-transparent text-status-danger hover:bg-status-danger/10";
    }
  }

  const variants = {
    primary: primaryStyles,
    secondary: "bg-surface-sunken border border-surface-border text-text-primary hover:bg-surface-border",
    ghost: ghostStyles,
    danger: "bg-status-danger text-white hover:bg-status-danger/90",
    outline: outlineStyles,
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
