/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ButtonGroupProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * Do not throw a warning for component deprecation.
	 * For internal components of other components that already throw the warning.
	 *
	 * @ignore
	 */
	__shouldNotWarnDeprecated?: boolean;
};
