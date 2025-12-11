import { type ComponentProps } from '../utils/types';

type FontFamily = 'heading' | 'body' | 'mono';

type FontSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type FontWeight = 'regular' | 'medium';

type LineHeight = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TextProps extends ComponentProps< 'span' > {
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
