  "use client"

import * as React from "react"
import { Textarea } from "./textarea"
import { Button } from "./button"
import { Dialog, DialogContent, DialogTitle } from "./dialog"
import { Pencil } from "lucide-react"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
}

export function MarkdownEditor({
  value,
  onChange,
  onSubmit,
  placeholder
}: MarkdownEditorProps) {
  const [open, setOpen] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Handle special key combinations
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd, value } = textarea

    // Handle Enter key
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      handleSubmit()
      return
    }

    // Handle code block autocompletion
    if (e.key === "`") {
      const beforeCursor = value.slice(0, selectionStart)
      const afterCursor = value.slice(selectionEnd)
      
      // Triple backtick
      if (beforeCursor.endsWith("``")) {
        e.preventDefault()
        const insertion = "```\n\n```"
        onChange(
          value.slice(0, selectionStart - 2) + insertion + afterCursor
        )
        // Place cursor between the code block
        setTimeout(() => {
          textarea.setSelectionRange(
            selectionStart + 2,
            selectionStart + 2
          )
        }, 0)
        return
      }
      
      // Single backtick
      if (!beforeCursor.endsWith("`")) {
        e.preventDefault()
        const insertion = "``"
        onChange(
          value.slice(0, selectionStart) + insertion + afterCursor
        )
        // Place cursor between the backticks
        setTimeout(() => {
          textarea.setSelectionRange(
            selectionStart + 1,
            selectionStart + 1
          )
        }, 0)
      }
    }
  }

  const handleSubmit = () => {
    onSubmit()
    setOpen(false)
  }

  return (
    <>
      <div className="flex gap-2">
        <div 
          className="flex-1 cursor-text"
          onClick={() => {
            setOpen(true)
            // Focus textarea after dialog animation
            setTimeout(() => textareaRef.current?.focus(), 100)
          }}
        >
          <Textarea
            value={value}
            readOnly
            placeholder={placeholder}
            className="h-[40px] py-2"
          />
        </div>
        <Button 
          onClick={handleSubmit}
          className="h-[40px] px-4"
        >
          Send
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Compose Prompt
          </DialogTitle>
          <div className="relative flex-1 mt-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-full resize-none border-[0.5px] p-4"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
