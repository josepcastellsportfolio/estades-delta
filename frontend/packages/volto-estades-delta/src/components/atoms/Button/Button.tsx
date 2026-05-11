import React from 'react';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full container width. */
  block?: boolean;
  /** Render as `<a>` instead of `<button>`. Use for navigational actions. */
  as?: 'button' | 'a';
  /** Optional leading icon node — kept loose to avoid pinning an icon library. */
  leadingIcon?: React.ReactNode;
  /** Optional trailing icon node. */
  trailingIcon?: React.ReactNode;
}

type AnchorProps = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps> & {
    as: 'a';
  };
type NativeButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
    as?: 'button';
  };
export type ButtonProps = AnchorProps | NativeButtonProps;

const classNames = (
  variant: ButtonVariant,
  size: ButtonSize,
  block: boolean,
  extra?: string,
) =>
  [
    'ed-btn',
    `ed-btn--${variant}`,
    `ed-btn--${size}`,
    block ? 'ed-btn--block' : null,
    extra,
  ]
    .filter(Boolean)
    .join(' ');

/**
 * Boutique button. Palette-agnostic — every colour comes from a CSS custom
 * property defined in palettes.scss, so the same component paints differently
 * under any <PaletteScope>.
 */
export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'md',
    block = false,
    as = 'button',
    leadingIcon,
    trailingIcon,
    className,
    children,
    ...rest
  } = props as ButtonProps & { className?: string; children?: React.ReactNode };

  const cls = classNames(variant, size, block, className);

  if (as === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={cls}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={cls}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});

export default Button;
