/**
 * Internal dependencies
 */
import { type ComponentProps } from '../utils/types';

type SizeToken = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

type Size = number | SizeToken;

type BackgroundColor =
	| 'neutral'
	| 'neutral-strong'
	| 'neutral-weak'
	| 'brand'
	| 'success'
	| 'success-weak'
	| 'info'
	| 'info-weak'
	| 'warning'
	| 'warning-weak'
	| 'caution'
	| 'caution-weak'
	| 'error'
	| 'error-weak';

type ForegroundColor =
	| 'neutral'
	| 'neutral-weak'
	| 'success'
	| 'success-weak'
	| 'info'
	| 'info-weak'
	| 'warning'
	| 'warning-weak'
	| 'caution'
	| 'caution-weak'
	| 'error'
	| 'error-weak';

type DimensionVariant< T > = {
	block?: T;
	blockStart?: T;
	blockEnd?: T;
	inline?: T;
	inlineStart?: T;
	inlineEnd?: T;
};

export interface BoxProps extends ComponentProps< 'div' > {
	/**
	 * The target rendering element design token grouping to use for the box.
	 */
	target?: string;

	/**
	 * The surface background design token for box background color.
	 */
	backgroundColor?: BackgroundColor;

	/**
	 * The surface foreground design token for box text color.
	 */
	color?: ForegroundColor;

	/**
	 * The surface spacing design token or base unit multiplier for box padding.
	 */
	padding?: Size | DimensionVariant< Size >;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
