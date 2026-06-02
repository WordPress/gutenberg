/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

interface DashboardUIContextValue {
	inserterOpen: boolean;
	setInserterOpen: ( next: boolean ) => void;
}

const Context = createContext< DashboardUIContextValue | null >( null );

/**
 * UI-state hook used by the inserter modal and any compound that needs to
 * open or close it (today: the "Add widgets" trigger in `Actions`).
 *
 * Throws when called outside `WidgetDashboard` so misuse fails loudly during
 * development.
 */
export function useDashboardUIContext(): DashboardUIContextValue {
	const ctx = useContext( Context );
	if ( ! ctx ) {
		throw new Error(
			'Dashboard compound used outside a WidgetDashboard subtree.'
		);
	}
	return ctx;
}

interface ProviderProps {
	children: ReactNode;
}

/**
 * Holds transient UI state shared across compounds (today: whether the
 * inserter modal is open). Kept separate from the data context so that data
 * mutations don't churn the UI state and vice-versa.
 * @param root0
 * @param root0.children
 */
export function WidgetDashboardUIProvider( { children }: ProviderProps ) {
	const [ inserterOpen, setInserterOpen ] = useState( false );

	const value = useMemo< DashboardUIContextValue >(
		() => ( { inserterOpen, setInserterOpen } ),
		[ inserterOpen ]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
