import { type ButtonIconProps, type ButtonProps } from '../button/types';
import { type LinkProps } from '../link/types';

type LinkButtonVisualProps = Pick<
	ButtonProps,
	'variant' | 'tone' | 'size' | 'children'
>;

export interface LinkButtonProps
	extends Omit< LinkProps, keyof LinkButtonVisualProps >,
		LinkButtonVisualProps {}

export type { ButtonIconProps as LinkButtonIconProps };
