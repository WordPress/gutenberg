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

	layoutSettingsOpen: boolean;
	setLayoutSettingsOpen: ( next: boolean ) => void;
	resetDialogOpen: boolean;
	setResetDialogOpen: ( next: boolean ) => void;

	/**
	 * `uuid` of the instance whose settings drawer is open, or `null`
	 * when no settings drawer is showing. The per-instance gear in the
	 * chrome sets it; the single `WidgetSettings` at the root reads
	 * it.
	 */
	settingsWidgetUuid: string | null;
	setSettingsWidgetUuid: ( next: string | null ) => void;
}

const Context = createContext< DashboardUIContextValue | null >( null );

/**
 * Accesses the shared UI state: overlay open flags and the active settings
 * instance with its placement. Throws when called outside `WidgetDashboard`.
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
 * Holds transient UI state shared across compounds (the inserter modal and
 * the per-instance settings drawer). Kept separate from the data context so
 * that data mutations don't churn the UI state and vice-versa.
 *
 * @param {ProviderProps} props Component props.
 */
export function WidgetDashboardUIProvider( { children }: ProviderProps ) {
	const [ inserterOpen, setInserterOpen ] = useState( false );
	const [ layoutSettingsOpen, setLayoutSettingsOpen ] = useState( false );
	const [ resetDialogOpen, setResetDialogOpen ] = useState( false );
	const [ settingsWidgetUuid, setSettingsWidgetUuid ] = useState<
		string | null
	>( null );

	const value = useMemo< DashboardUIContextValue >(
		() => ( {
			inserterOpen,
			setInserterOpen,
			layoutSettingsOpen,
			setLayoutSettingsOpen,
			resetDialogOpen,
			setResetDialogOpen,
			settingsWidgetUuid,
			setSettingsWidgetUuid,
		} ),
		[
			inserterOpen,
			layoutSettingsOpen,
			resetDialogOpen,
			settingsWidgetUuid,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
