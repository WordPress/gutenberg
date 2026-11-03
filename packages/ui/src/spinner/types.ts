import type { ComponentProps } from 'react';

export type SpinnerProps = Omit< ComponentProps< 'svg' >, 'color' > & {
	/**
	 * The spinner color. Accepts any CSS color value, including `currentColor`
	 * to inherit the surrounding text color.
	 *
	 * @default 'var(--wpds-color-foreground-content-neutral-weak)'
	 */
	color?: string;
};
