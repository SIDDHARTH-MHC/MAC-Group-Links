import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MacSearchBarProps = {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "default" | "hero";
  autoFocus?: boolean;
};

export function MacSearchBar({
  name = "q",
  defaultValue,
  value,
  onChange,
  placeholder = "Search papers, teachers or departments…",
  className,
  size = "default",
  autoFocus,
}: MacSearchBarProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "hero" ? "left-4 h-5 w-5" : "left-3 h-4 w-4",
        )}
        aria-hidden
      />
      <Input
        name={onChange ? undefined : name}
        defaultValue={onChange ? undefined : defaultValue}
        value={onChange ? value : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "border-border bg-card shadow-sm",
          size === "hero"
            ? "h-12 rounded-xl pl-12 text-base md:h-14 md:text-lg"
            : "h-11 rounded-lg pl-10",
        )}
        aria-label={placeholder}
      />
    </div>
  );
}
