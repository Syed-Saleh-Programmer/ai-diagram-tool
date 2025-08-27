import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = React.useCallback((node: HTMLTextAreaElement) => {
      if (ref) {
        if (typeof ref === 'function') ref(node);
        else ref.current = node;
      }
      textareaRef.current = node;
    }, [ref]);

    const adjustHeight = React.useCallback(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [autoResize]);

    React.useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [adjustHeight, props.value]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        adjustHeight();
      }
      if (props.onInput) {
        props.onInput(e);
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={combinedRef}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
