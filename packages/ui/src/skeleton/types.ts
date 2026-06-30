import { type ComponentProps } from '../utils/types';

export interface SkeletonProps extends ComponentProps< 'div' > {
	/**
	 * Width of the placeholder. Numbers are treated as pixels;
	 * strings are passed through (e.g. '100%', '12rem').
	 */
	width?: number | string;

	/**
	 * Height of the placeholder. Numbers are treated as pixels;
	 * strings are passed through.
	 */
	height?: number | string;

	/**
	 * Corner radius, from the design system border-radius scale.
	 * `'full'` renders a pill / circle (use equal width & height for a circle).
	 *
	 * @default 'md'
	 */
	radius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

	/**
	 * The loading animation.
	 *
	 * @default 'pulse'
	 */
	animation?: 'pulse' | 'none';
}
