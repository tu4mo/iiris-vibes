import type { ComponentProps } from 'react'

type ToolbarButtonProps = ComponentProps<'button'> & {
  label: string
  // Omit for buttons that aren't toggles.
  active?: boolean
}

export function ToolbarButton({
  label,
  active,
  className = '',
  children,
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`relative isolate flex size-16 shrink-0 items-center justify-center text-sky-200 outline-none before:absolute before:inset-2 before:-z-10 before:rounded-xl before:content-[''] hover:text-white hover:before:bg-white/10 focus-visible:before:ring-2 focus-visible:before:ring-amber-300 aria-pressed:text-indigo-950 aria-pressed:before:bg-sky-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
