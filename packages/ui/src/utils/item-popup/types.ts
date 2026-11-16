import type { ReactNode } from 'react';
import type { ComponentProps } from '../types';

export type LoadingIndicatorProps = ComponentProps< 'div' > & {
	/**
	 * The loading message displayed beside the spinner.
	 *
	 * @default __( 'Loading…' )
	 */
	children?: ReactNode;
};
