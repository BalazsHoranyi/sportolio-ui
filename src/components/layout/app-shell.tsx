import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppShellProps = {
  title: string
  description: string
  children: ReactNode
  headerContent?: ReactNode
  className?: string
  mainId?: string
  maxWidth?: "default" | "narrow"
}

const MAX_WIDTH_CLASS_BY_VARIANT: Record<
  NonNullable<AppShellProps["maxWidth"]>,
  string
> = {
  default: "max-w-6xl",
  narrow: "max-w-5xl"
}

export function AppShell({
  title,
  description,
  children,
  headerContent,
  className,
  mainId = "main-content",
  maxWidth = "default"
}: AppShellProps) {
  return (
    <main
      id={mainId}
      data-layout="app-shell"
      tabIndex={-1}
      className={cn(
        "app-shell",
        MAX_WIDTH_CLASS_BY_VARIANT[maxWidth],
        className
      )}
    >
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {headerContent}
      </header>
      {children}
    </main>
  )
}
