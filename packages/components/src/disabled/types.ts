/**
 * External dependencies
 */
import type { ComponentPropsWithRef } from 'react';

export interface DisabledProps extends ComponentPropsWithRef< 'div' > {
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
