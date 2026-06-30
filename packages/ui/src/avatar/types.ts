import type { ReactNode } from 'react';
import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import type { ComponentProps } from '../utils/types';

export type AvatarSize = 'sm' | 'md' | 'lg';

export type RootProps = ComponentProps< typeof _Avatar.Root > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * The size of the avatar.
	 *
	 * @default 'md'
	 */
	size?: AvatarSize;

	/**
	 * An optional outline color, typically used to distinguish users in
	 * collaborative contexts.
	 */
	outlineColor?: string;
};

export type ImageProps = ComponentProps< typeof _Avatar.Image >;

export type FallbackProps = ComponentProps< typeof _Avatar.Fallback > & {
	/**
	 * The fallback content, such as user initials.
	 */
	children?: ReactNode;
};
