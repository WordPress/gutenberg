/**
 * Internal dependencies
 */
import { type ComponentProps } from '../utils/types';

type SizeToken = 'x-small' | 'small' | 'medium' | 'large';

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
	 * The family of design tokens to use for the box.
	 */
	family?: string;

	/**
	 * The surface background design token for box background color.
	 *
	 * Shorthand for `background`.
	 */
	bg?: BackgroundColor;

	/**
	 * The surface background design token for box background color.
	 */
	background?: BackgroundColor;

	/**
	 * The surface foreground design token for box text color.
	 *
	 * Shorthand for `foreground`.
	 */
	fg?: ForegroundColor;

	/**
	 * The surface foreground design token for box text color.
	 */
	foreground?: ForegroundColor;

	/**
	 * The surface spacing design token or base unit multiplier for box padding.
	 *
	 * Shorthand for `padding`.
	 */
	p?: Size | DimensionVariant< Size >;

	/**
	 * The surface spacing design token or base unit multiplier for box padding.
	 */
	padding?: Size | DimensionVariant< Size >;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
