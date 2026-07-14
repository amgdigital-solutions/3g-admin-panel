import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonGroupVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      default: "divide-x divide-border rounded-md border",
      outline: "divide-x divide-border rounded-md border",
      ghost: "divide-x divide-border",
    },
    size: {
      default: "h-9",
      sm: "h-8",
      lg: "h-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

const ButtonGroupContext = React.createContext<VariantProps<typeof buttonGroupVariants>>({})

interface ButtonGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {}

export function ButtonGroup({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonGroupProps) {
  return (
    <ButtonGroupContext.Provider value={{ variant, size }}>
      <div className={cn(buttonGroupVariants({ variant, size, className }))} {...props}>
        {children}
      </div>
    </ButtonGroupContext.Provider>
  )
}

export function ButtonGroupItem({
  children,
  className,
  isActive,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  const { variant, size } = React.useContext(ButtonGroupContext)
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center px-3 text-sm font-medium transition-colors",
        variant === "default" && "bg-background hover:bg-muted",
        variant === "outline" && "bg-transparent hover:bg-muted",
        variant === "ghost" && "bg-transparent hover:bg-muted",
        isActive && "bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
