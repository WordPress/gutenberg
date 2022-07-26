/**
 * External dependencies
 */
import type { ComponentProps } from 'react';

export interface DisabledProps extends ComponentProps< 'div' > {
	/**
	 * Whether to disable all the descendant fields.
	 *
	 * @default true
	 */
	isDisabled?: boolean;

	/**
	 * The children elements.
	 */
	children: React.ReactNode;
}
