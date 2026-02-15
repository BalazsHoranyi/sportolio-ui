type SkipToContentLinkProps = {
  targetId?: string
}

export function SkipToContentLink({
  targetId = "main-content"
}: SkipToContentLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only absolute left-3 top-3 z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}
