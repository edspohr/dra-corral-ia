import { type ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'white' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-[#5A7248] text-white',
    'hover:bg-[#3D5230]',
    'shadow-[0_2px_8px_rgba(90,114,72,0.22)]',
    'hover:shadow-[0_4px_16px_rgba(90,114,72,0.30)]',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'disabled:hover:bg-[#5A7248] disabled:hover:shadow-none',
  ].join(' '),
  secondary: [
    'bg-transparent text-[#3D5230]',
    'border border-[#5A7248]',
    'hover:bg-[#EEF5E6]',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  white: [
    'bg-white text-[#3D5230]',
    'border border-[#D4E4C4]',
    'hover:bg-[#F8F6F2] hover:border-[#8BA876]',
    'shadow-[0_1px_3px_rgba(30,30,20,0.06)]',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-[#5A7248]',
    'hover:bg-[#EEF5E6]',
    'active:scale-[0.98]',
    'transition-colors duration-150',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 min-h-[36px] px-4 text-sm',
  md: 'h-12 min-h-[48px] px-6 text-base',
  lg: 'h-14 min-h-[56px] px-8 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-2',
          'font-sans font-medium',
          'rounded-[var(--radius-pill)]',
          'transition-all duration-200 ease-in-out',
          'cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-dark focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
