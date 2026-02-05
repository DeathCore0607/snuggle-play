import * as React from "react";
// import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Note: I am not installing class-variance-authority, I can just do it manually or install it. 
// Plan didn't explicitly mention cva but it's standard. I'll stick to manual if not available, OR install it.
// Actually, simple props are fine. Let's do simple manual generic classes to avoid extra deps if I didn't install cva. 
// "Tech stack: TailwindCSS (no heavy UI libs; you may use small primitives like Headless UI or Radix if needed)".
// I'll stick to simple logic.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {

        const variants = {
            primary: "bg-lavender-500 text-white hover:bg-lavender-400 shadow-lg shadow-lavender-500/30",
            secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-100 shadow-sm",
            ghost: "bg-transparent hover:bg-white/20 text-slate-700",
            danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2",
            lg: "h-12 px-8 text-lg",
            icon: "h-10 w-10 p-2 flex items-center justify-center",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-lavender-400",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={props.disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
