import type { BorderRadiusSize } from '@wordpress/theme';
import { type ComponentProps } from '../utils/types';

export interface SkeletonProps extends ComponentProps< 'div' > {
	/**
	 * Corner radius, from the design system border-radius scale.
	 * `'full'` renders a pill / circle (use equal width & height for a circle).
	 *
	 * @default 'md'
	 */
	radius?: BorderRadiusSize | 'full' | 'none';

	/**
	 * The loading animation.
	 *
	 * @default 'pulse'
	 */
	animation?: 'pulse' | 'none';
}
