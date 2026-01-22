import type { ComponentProps } from '../utils/types';

export interface CardProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}

export interface CardSectionProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
