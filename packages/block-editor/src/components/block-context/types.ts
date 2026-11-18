import type { ReactNode } from 'react';

export interface BlockContextProviderProps {
	/**
	 * Context value to merge with current value.
	 */
	value: Record< string, unknown >;
	/**
	 * Component children.
	 */
	children: ReactNode;
}
