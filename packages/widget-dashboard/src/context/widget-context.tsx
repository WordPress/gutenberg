/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WidgetContextValue } from '../types';

const WidgetContext = createContext< WidgetContextValue | null >( null );

interface ProviderProps {
	value: WidgetContextValue;
	children: ReactNode;
}

/**
 * Provides the current widget's identity to its render subtree.
 *
 * @param {ProviderProps} props Component props.
 */
export function WidgetContextProvider( {
	value,
	children,
}: ProviderProps ): React.ReactNode {
	return (
		<WidgetContext.Provider value={ value }>
			{ children }
		</WidgetContext.Provider>
	);
}

/**
 * Returns the current widget's identity (`uuid`, `name`, `index`). Returns
 * `null` when called outside a widget render subtree.
 */
export function useWidgetContext(): WidgetContextValue | null {
	return useContext( WidgetContext );
}
