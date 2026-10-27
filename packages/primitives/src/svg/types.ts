import type { ComponentPropsWithoutRef } from 'react';

export type SVGProps = {
	/**
	 * Indicates whether the SVG should appear as pressed.
	 */
	isPressed?: boolean;
} & ComponentPropsWithoutRef< 'svg' >;
