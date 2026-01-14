/**
 * Internal dependencies
 */
import { type ComponentProps } from '../utils/types';

export interface BadgeProps extends ComponentProps< 'span' > {
	/**
	 * The text to display in the badge.
	 */
	children: string;

	/**
	 * The semantic intent of the badge, communicating its meaning through color.
	 *
	 * @default "none"
	 */
	intent?:
		| 'high'
		| 'medium'
		| 'low'
		| 'stable'
		| 'informational'
		| 'draft'
		| 'none';
}
