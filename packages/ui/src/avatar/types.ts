import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import type { ComponentProps } from '../utils/types';

export type RootProps = Omit<
	ComponentProps< typeof _Avatar.Root >,
	'color'
> & {
	/**
	 * Colors the image's inner ring or opaque fallback background, automatically
	 * choosing a contrasting foreground tint for fallbacks.
	 *
	 * Accepts CSS colors and variables that resolve to a color. Do not use
	 * `currentColor`, including through variables, or CSS-wide keywords such as
	 * `inherit`. Browsers without support for colored fallbacks use neutral colors.
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
