import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import type { ComponentProps } from '../utils/types';

export type RootProps = ComponentProps< typeof _Avatar.Root > & {
	/**
	 * The size of the avatar.
	 *
	 * @default "md"
	 */
	size?: 'sm' | 'md' | 'lg';
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
