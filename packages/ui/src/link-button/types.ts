import { type ButtonIconProps, type ButtonProps } from '../button/types';
import { type LinkProps } from '../link/types';
import { type ComponentProps } from '../utils/types';

type LinkButtonVisualProps = Pick<
	ButtonProps,
	'variant' | 'tone' | 'size' | 'children'
>;

export interface LinkButtonProps
	extends Omit<
			ComponentProps< 'a' >,
			keyof LinkButtonVisualProps | 'target'
		>,
		LinkButtonVisualProps,
		Pick< LinkProps, 'openInNewTab' > {
	/**
	 * The URL to navigate to.
	 */
	href: NonNullable< ComponentProps< 'a' >[ 'href' ] >;
}

export type { ButtonIconProps as LinkButtonIconProps };
