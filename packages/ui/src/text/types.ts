import {
	type Target,
	type FontFamily,
	type FontSize,
	type FontWeight,
	type LineHeight,
	type ForegroundColor,
} from '@wordpress/theme';
import { type ComponentProps } from '../utils/types';

export interface TextProps extends ComponentProps< 'span' > {
	/**
	 * The target rendering element design token grouping to use for the text.
	 *
	 * @default 'content'
	 */
	target?: Target;

	/**
	 * The foreground design token for text color.
	 */
	color?: ForegroundColor;

	/**
	 * The font family design token.
	 */
	fontFamily?: FontFamily;

	/**
	 * The font size design token.
	 */
	fontSize?: FontSize;

	/**
	 * The font weight design token.
	 */
	fontWeight?: FontWeight;

	/**
	 * The line height design token.
	 */
	lineHeight?: LineHeight;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
