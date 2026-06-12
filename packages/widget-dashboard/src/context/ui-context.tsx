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

	/** Opened by the Layout settings button in the customize toolbar. */
	layoutSettingsOpen: boolean;
	setLayoutSettingsOpen: ( next: boolean ) => void;
	resetDialogOpen: boolean;
	setResetDialogOpen: ( next: boolean ) => void;

	/**
	 * `uuid` of the instance whose settings drawer is open, or `null`
	 * when no settings drawer is showing. The per-instance gear in the
	 * chrome sets it; the single `WidgetSettings` drawer at the root reads
	 * it.
	 */
	settingsWidgetUuid: string | null;
	setSettingsWidgetUuid: ( next: string | null ) => void;

	/**
	 * Edge the settings drawer slides in from. The gear sets it from the
	 * widget's on-screen position so the drawer opens on the side away
	 * from the widget, trying not to cover it.
	 */
	settingsDrawerSide: 'left' | 'right';
	setSettingsDrawerSide: ( next: 'left' | 'right' ) => void;

	/**
	 * Inline-start inset (px) the settings drawer is offset by when it
	 * opens from the left, so it clears fixed page chrome (the WordPress
	 * admin menu) instead of sliding over it. `0` when there's nothing to
	 * clear.
	 */
	settingsDrawerInset: number;
	setSettingsDrawerInset: ( next: number ) => void;
}

const Context = createContext< DashboardUIContextValue | null >( null );

/**
 * UI-state hook used by the inserter modal and any compound that needs to
 * open or close it (today: the "Add widget" and "Layout settings"
 * triggers in `Actions`).
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
 * Holds transient UI state shared across compounds (the inserter modal and
 * the per-instance settings drawer). Kept separate from the data context so
 * that data mutations don't churn the UI state and vice-versa.
 * @param root0
 * @param root0.children
 */
export function WidgetDashboardUIProvider( { children }: ProviderProps ) {
	const [ inserterOpen, setInserterOpen ] = useState( false );
	const [ layoutSettingsOpen, setLayoutSettingsOpen ] = useState( false );
	const [ resetDialogOpen, setResetDialogOpen ] = useState( false );
	const [ settingsWidgetUuid, setSettingsWidgetUuid ] = useState<
		string | null
	>( null );
	const [ settingsDrawerSide, setSettingsDrawerSide ] = useState<
		'left' | 'right'
	>( 'right' );
	const [ settingsDrawerInset, setSettingsDrawerInset ] = useState( 0 );

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
			settingsDrawerSide,
			setSettingsDrawerSide,
			settingsDrawerInset,
			setSettingsDrawerInset,
		} ),
		[
			inserterOpen,
			layoutSettingsOpen,
			resetDialogOpen,
			settingsWidgetUuid,
			settingsDrawerSide,
			settingsDrawerInset,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
