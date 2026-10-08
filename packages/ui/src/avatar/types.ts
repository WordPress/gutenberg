import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import type { ComponentProps } from '../utils/types';

export type RootProps = ComponentProps< typeof _Avatar.Root > & {
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

export type ImageProps = ComponentProps< typeof _Avatar.Image >;

export type FallbackProps = ComponentProps< typeof _Avatar.Fallback > & {
	/**
	 * The initials, icon, or other content to show until the image loads.
	 */
	children?: React.ReactNode;
};
