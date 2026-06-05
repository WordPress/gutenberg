import { type ButtonIconProps, type ButtonProps } from '../button/types';
import { type ComponentProps } from '../utils/types';

type LinkButtonVisualProps = Pick<
	ButtonProps,
	'variant' | 'tone' | 'size' | 'children'
>;

export interface LinkButtonProps
	extends Omit< ComponentProps< 'a' >, keyof LinkButtonVisualProps >,
		LinkButtonVisualProps {
	/**
	 * The URL to navigate to.
	 */
	href: NonNullable< ComponentProps< 'a' >[ 'href' ] >;
}

export type { ButtonIconProps as LinkButtonIconProps };
