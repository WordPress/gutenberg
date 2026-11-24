export const brand = 'var(--wpds-color-background-interactive-brand-strong)';
export const neutral = 'var(--wpds-color-background-interactive-neutral)';
export const surface = 'var(--wpds-color-background-surface-neutral-strong)';
export const surfaceWeak = 'var(--wpds-color-background-surface-neutral-weak)';
export const foreground = 'var(--wpds-color-foreground-content-neutral)';
export const stroke = 'var(--wpds-color-stroke-surface-neutral)';
export const muted = 'var(--wpds-color-stroke-surface-neutral-weak)';

// Corner radii follow the tokens used by the real components: `sm` for
// buttons, inputs and tiles, `xs` for checkboxes, `lg` for cards and panels.
const radius = ( value: string ) => ( { rx: value } ) as React.CSSProperties;
export const r = {
	xs: radius( 'min(var(--wpds-border-radius-sm), 2px)' ),
	sm: radius( 'var(--wpds-border-radius-sm)' ),
	lg: radius( 'var(--wpds-border-radius-lg)' ),
};
