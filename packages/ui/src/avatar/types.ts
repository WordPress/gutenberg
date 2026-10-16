import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import type { ComponentProps } from '../utils/types';

export type RootProps = Omit<
	ComponentProps< typeof _Avatar.Root >,
	'color'
> & {
	/**
	 * The color of an optional ring around the avatar. Accepts any CSS color,
	 * including CSS variables. Without an image, supporting browsers also use
	 * an opaque sRGB fill derived from this color and a contrasting foreground.
	 * Other browsers retain the neutral fallback. Images keep their own colors.
	 * The ring paints over the avatar's inner edge without changing its layout size.
	 * Foreground tinting targets at least 4.5:1 contrast for text and 3:1 for
	 * the default person icon when the fill resolves independently.
	 *
	 * The colored fallback's fill must resolve independently of its foreground.
	 * `currentColor`, including through CSS variables or color functions, is
	 * unsupported for colored fallbacks and can produce insufficient contrast.
	 * CSS-wide keywords such as `inherit` cannot be used as fallback fills.
	 * Alpha is discarded, and out-of-gamut channels are clipped to sRGB.
	 *
	 * Development warnings are best-effort. They do not resolve CSS variables
	 * or detect every unsupported expression, including escaped keywords.
	 * The absence of a warning does not guarantee sufficient contrast.
	 */
	color?: React.CSSProperties[ 'color' ];
	/**
	 * The size of the avatar: `xs` (16px), `sm` (24px), `md` (32px),
	 * `lg` (40px), or `xl` (64px) with the default design tokens.
	 *
	 * @default "md"
	 */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	/**
	 * The shape of the avatar. Square avatars use the theme's corner radius
	 * for buttons and controls. Circles keep their shape in every theme.
	 *
	 * @default "circle"
	 */
	shape?: 'circle' | 'square';
	/**
	 * The avatar image, fallback, and any custom decorations.
	 */
	children?: React.ReactNode;
};

export type ImageProps = Omit<
	ComponentProps< typeof _Avatar.Image >,
	'src' | 'alt'
> & {
	/**
	 * The URL of the image to display.
	 */
	src?: ComponentProps< typeof _Avatar.Image >[ 'src' ];
	/**
	 * Alternative text for the image.
	 */
	alt?: ComponentProps< typeof _Avatar.Image >[ 'alt' ];
};

export type FallbackProps = ComponentProps< typeof _Avatar.Fallback > & {
	/**
	 * Custom fallback content. Omit to display the standard person icon.
	 */
	children?: React.ReactNode;
};

export type InitialsProps = Omit< FallbackProps, 'children' > & {
	/**
	 * The person's display name. Blank names use the standard person fallback.
	 */
	name?: string;
	/**
	 * Locale used for character segmentation and uppercase conversion.
	 * Defaults to the runtime's locale.
	 */
	locale?: string;
};
