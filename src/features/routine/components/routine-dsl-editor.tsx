"use client"

import { autocompletion, completeFromList } from "@codemirror/autocomplete"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import CodeMirror from "@uiw/react-codemirror"
import { useMemo } from "react"

import { Label } from "@/components/ui/label"
import { ROUTINE_DSL_COMPLETIONS } from "@/features/routine/routine-dsl-diagnostics"

type RoutineDslEditorProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function RoutineDslEditor({
  id,
  label,
  value,
  onChange
}: RoutineDslEditorProps) {
  const extensions = useMemo(
    () => [
      json(),
      autocompletion({
        override: [completeFromList([...ROUTINE_DSL_COMPLETIONS])]
      }),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        "aria-label": label
      })
    ],
    [label]
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {process.env.NODE_ENV === "test" ? (
        <textarea
          id={id}
          aria-label={label}
          className="min-h-[300px] w-full rounded-md border px-3 py-2 font-mono text-sm"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <CodeMirror
          id={id}
          value={value}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true
          }}
          height="320px"
          onChange={(nextValue) => {
            onChange(nextValue)
          }}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Syntax highlighting and autocomplete enabled. Use Ctrl/Cmd + Space for
        completion suggestions.
      </p>
    </div>
  )
}
