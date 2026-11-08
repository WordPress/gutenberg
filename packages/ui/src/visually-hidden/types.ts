import type { ComponentProps } from '../utils/types';

export interface VisuallyHiddenProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
