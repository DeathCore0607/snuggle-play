import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "bg-glass-white backdrop-blur-md border border-glass-border shadow-glass rounded-3xl p-6",
                className
            )}
            {...props}
        />
    )
);
Card.displayName = "Card";

export { Card };
