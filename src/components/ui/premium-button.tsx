import React, { forwardRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const premiumButtonVariants = cva(
  [
    // Base styles with premium foundation
    "inline-flex items-center justify-center",
    "font-medium text-sm",
    "rounded-lg border",
    "cursor-pointer",
    "transition-all duration-200 ease-out",
    "relative overflow-hidden",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
    
    // Premium micro-interactions
    "hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5",
    "active:scale-[0.98] active:translate-y-0",
    "transform-gpu", // Hardware acceleration
    
    // Subtle shine effect on hover
    "before:absolute before:inset-0 before:rounded-lg",
    "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
    "before:translate-x-[-100%] before:skew-x-12",
    "before:transition-transform before:duration-700 before:ease-out",
    "hover:before:translate-x-[100%]",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground border-primary/20",
          "shadow-lg shadow-primary/20",
          "hover:bg-primary/90 hover:shadow-primary/30",
          "focus:ring-primary/30",
          "dark:shadow-primary/10",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground border-destructive/20",
          "shadow-lg shadow-destructive/20",
          "hover:bg-destructive/90 hover:shadow-destructive/30",
          "focus:ring-destructive/30",
        ],
        outline: [
          "border-border bg-background text-foreground",
          "shadow-sm",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
          "focus:ring-primary/30",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground border-secondary/20",
          "shadow-sm",
          "hover:bg-secondary/80 hover:shadow-md",
          "focus:ring-secondary/30",
        ],
        ghost: [
          "border-transparent bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:ring-accent/30",
        ],
        link: [
          "border-transparent bg-transparent text-primary underline-offset-4",
          "hover:underline hover:text-primary/80",
          "focus:ring-primary/30",
        ],
        // Special Engie variant
        engie: [
          "bg-gradient-to-r from-engie-primary to-primary",
          "text-white border-engie-primary/20",
          "shadow-lg shadow-engie-primary/20",
          "hover:shadow-engie-primary/30 hover:shadow-xl",
          "focus:ring-engie-primary/30",
          
          // Special sparkle effect for Engie
          "after:absolute after:inset-0 after:rounded-lg",
          "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
          "after:translate-x-[-100%] after:skew-x-12 after:delay-300",
          "after:transition-transform after:duration-500",
          "hover:after:translate-x-[100%]",
        ],
        premium: [
          "bg-gradient-to-br from-foreground to-foreground/80",
          "text-background border-foreground/20",
          "shadow-lg shadow-foreground/20",
          "hover:shadow-foreground/30 hover:shadow-xl",
          "focus:ring-foreground/30",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1 text-xs rounded-md",
        lg: "h-12 px-6 py-3 text-base rounded-xl",
        xl: "h-14 px-8 py-4 text-lg rounded-xl",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
        "icon-lg": "h-12 w-12 p-0 rounded-xl",
      },
      loading: {
        true: "pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loadingText?: string;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      loadingText,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(premiumButtonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="premium-spinner" />
          </div>
        )}
        
        {/* Content wrapper for smooth transitions */}
        <div className={cn(
          "flex items-center gap-2 transition-opacity duration-200",
          loading && "opacity-0"
        )}>
          {leftIcon && (
            <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              {leftIcon}
            </span>
          )}
          
          <span className="transition-all duration-200">
            {loading && loadingText ? loadingText : children}
          </span>
          
          {rightIcon && (
            <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              {rightIcon}
            </span>
          )}
        </div>
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

// Premium loading spinner styles (to be added to global CSS)
const premiumSpinnerStyles = `
.premium-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: premium-spin 0.8s linear infinite;
}

@keyframes premium-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Premium button group for related actions */
.premium-button-group {
  display: inline-flex;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.premium-button-group > button:not(:first-child) {
  border-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.premium-button-group > button:not(:last-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.premium-button-group > button:hover {
  z-index: 10;
}

/* Premium floating action button */
.premium-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
  color: hsl(var(--primary-foreground));
  border: none;
  cursor: pointer;
  box-shadow: 
    0 8px 25px hsl(var(--primary) / 0.3),
    0 4px 12px hsl(var(--primary) / 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.premium-fab:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 12px 35px hsl(var(--primary) / 0.4),
    0 6px 16px hsl(var(--primary) / 0.25);
}

.premium-fab:active {
  transform: translateY(-1px) scale(1.02);
}

/* Premium tooltip for enhanced buttons */
.premium-tooltip {
  position: relative;
}

.premium-tooltip::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
  z-index: 100;
}

.premium-tooltip:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

/* Button states for enhanced feedback */
.premium-button-success {
  animation: premium-success-pulse 0.6s ease-out;
}

@keyframes premium-success-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px hsl(var(--primary) / 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0);
  }
}

/* Enhanced focus states for accessibility */
@media (prefers-reduced-motion: no-preference) {
  .premium-button:focus-visible {
    animation: premium-focus-glow 2s ease-in-out infinite;
  }
}

@keyframes premium-focus-glow {
  0%, 100% {
    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
  }
  50% {
    box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .premium-fab {
    width: 3rem;
    height: 3rem;
    bottom: 1rem;
    right: 1rem;
  }
  
  .premium-button {
    min-height: 44px; /* Apple's recommended touch target */
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .premium-button {
    border-width: 2px;
  }
  
  .premium-button:focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
  .premium-spinner {
    filter: brightness(1.2);
  }
}
`;

export { PremiumButton, premiumButtonVariants, premiumSpinnerStyles };
export type { PremiumButtonProps }; 