import { type ComponentProps } from '../utils/types';

type FontFamily = 'heading' | 'body' | 'mono';

type FontSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type FontWeight = 'regular' | 'medium';

type LineHeight = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ForegroundColor =
	| 'neutral'
	| 'neutral-weak'
	| 'neutral-active'
	| 'neutral-disabled'
	| 'neutral-strong'
	| 'neutral-strong-active'
	| 'neutral-strong-disabled'
	| 'neutral-weak-disabled'
	| 'brand'
	| 'brand-active'
	| 'brand-disabled'
	| 'brand-strong'
	| 'brand-strong-active'
	| 'brand-strong-disabled'
	| 'success'
	| 'success-weak'
	| 'info'
	| 'info-weak'
	| 'warning'
	| 'warning-weak'
	| 'caution'
	| 'caution-weak'
	| 'error'
	| 'error-weak'
	| 'error-active'
	| 'error-disabled'
	| 'error-strong'
	| 'error-strong-active'
	| 'error-strong-disabled';

export interface TextProps extends ComponentProps< 'span' > {
	/**
	 * The target rendering element design token grouping to use for the text.
	 *
	 * @default 'content'
	 */
	target?: string;

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
