import {
	type PaddingSize,
	type BorderRadiusSize,
	type BorderWidthSize,
	type Target,
	type SurfaceBackgroundColor,
	type ContentForegroundColor,
	type SurfaceStrokeColor,
} from '@wordpress/theme';
import { type ComponentProps } from '../utils/types';

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
	target?: Target;

	/**
	 * The surface background design token for box background color.
	 */
	backgroundColor?: SurfaceBackgroundColor;

	/**
	 * The surface foreground design token for box text color.
	 */
	color?: ContentForegroundColor;

	/**
	 * The surface spacing design token or base unit multiplier for box padding.
	 */
	padding?: PaddingSize | DimensionVariant< PaddingSize >;

	/**
	 * The surface border radius design token.
	 */
	borderRadius?: BorderRadiusSize;

	/**
	 * The surface border width design token.
	 */
	borderWidth?: BorderWidthSize;

	/**
	 * The surface border stroke color design token.
	 */
	borderColor?: SurfaceStrokeColor;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
