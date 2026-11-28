import { type ButtonIconProps, type ButtonProps } from '../button/types';
import { type LinkProps } from '../link/types';

type ButtonLinkVisualProps = Pick<
	ButtonProps,
	'variant' | 'tone' | 'size' | 'children'
>;

export interface ButtonLinkProps
	extends
		Omit< LinkProps, keyof ButtonLinkVisualProps >,
		ButtonLinkVisualProps {}

export type { ButtonIconProps as ButtonLinkIconProps };
