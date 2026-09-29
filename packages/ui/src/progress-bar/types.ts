import type { Progress as _Progress } from '@base-ui/react/progress';
import type { ComponentProps } from '../utils/types';

export interface ProgressBarProps extends Omit<
	ComponentProps< typeof _Progress.Root >,
	'value' | 'color'
> {
	/**
	 * The current value, between `min` and `max`. Omit it or use `null` when
	 * progress cannot be measured.
	 *
	 * @default null
	 */
	value?: number | null;

	/**
	 * The thickness of the progress bar: small (1.5px), medium (4px), or large
	 * (8px). Medium and large follow the theme's size tokens.
	 *
	 * @default "small"
	 */
	size?: 'small' | 'medium' | 'large';

	/**
	 * The color intent of the filled indicator. Overridden by `color`.
	 *
	 * @default "neutral"
	 */
	tone?: 'neutral' | 'brand';

	/**
	 * The filled indicator color, overriding `tone`. Accepts any CSS color value,
	 * including `currentColor` to inherit the surrounding text color.
	 * The track remains neutral.
	 */
	color?: string;
}
