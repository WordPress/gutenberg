import type { ReactNode } from 'react';
import {
	createContext,
	useContext,
	useMemo,
	useSyncExternalStore,
} from '@wordpress/element';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { privateApis as keyboardShortcutsPrivateApis } from '@wordpress/keyboard-shortcuts';
import { unlock } from '../../lock-unlock';
import { getPageKey } from './page-key';

type ShortcutCallback = ( event: KeyboardEvent ) => void;

interface ShortcutContextValue {
	add: ( shortcut: ShortcutCallback ) => void;
	delete: ( shortcut: ShortcutCallback ) => void;
}

const { ShortcutContext } = unlock( keyboardShortcutsPrivateApis ) as {
	ShortcutContext: React.Context< ShortcutContextValue >;
};

const { CommandsDisabledContext } = unlock( commandsPrivateApis ) as {
	CommandsDisabledContext: React.Context< boolean >;
};

const PageKeyContext = createContext< string | undefined >( undefined );

const listeners = new Set< () => void >();

/**
 * Tells `usePageVisibility` subscribers that the visible page may have
 * changed. The admin shell calls it after every switch.
 */
export function notifyPageVisibilityChange() {
	listeners.forEach( ( listener ) => listener() );
}

function subscribe( listener: () => void ) {
	listeners.add( listener );
	window.addEventListener( 'popstate', listener );
	return () => {
		listeners.delete( listener );
		window.removeEventListener( 'popstate', listener );
	};
}

function isPageVisible( pageKey: string | undefined ) {
	return pageKey === undefined || getPageKey() === pageKey;
}

/**
 * Returns whether the admin page the calling component belongs to is the one
 * showing. Several admin pages can share one document (see
 * `startAdminShell`); a page that isn't showing stays mounted but hidden.
 * Use it to pause work a hidden page doesn't need, such as polling or
 * timers. Outside the admin shell, it is always `true`.
 *
 * @return Whether the page is visible.
 */
export function usePageVisibility() {
	const pageKey = useContext( PageKeyContext );
	return useSyncExternalStore( subscribe, () => isPageVisible( pageKey ) );
}

/**
 * Scopes an app to its admin page: `usePageVisibility` reads the page from
 * here, keyboard shortcuts registered inside only fire while the page is
 * showing, and its commands are only in the command palette while the page
 * is showing.
 *
 * @param props          Component props.
 * @param props.pageKey  Page the app belongs to. See `getPageKey`.
 * @param props.children App.
 */
export function PageScope( {
	pageKey,
	children,
}: {
	pageKey: string;
	children: ReactNode;
} ) {
	const isVisible = useSyncExternalStore( subscribe, () =>
		isPageVisible( pageKey )
	);
	const parentShortcuts = useContext( ShortcutContext );
	const shortcuts = useMemo( () => {
		const wrappers = new Map< ShortcutCallback, ShortcutCallback >();
		return {
			add( shortcut: ShortcutCallback ) {
				const wrapper = ( event: KeyboardEvent ) => {
					if ( isPageVisible( pageKey ) ) {
						shortcut( event );
					}
				};
				wrappers.set( shortcut, wrapper );
				parentShortcuts.add( wrapper );
			},
			delete( shortcut: ShortcutCallback ) {
				const wrapper = wrappers.get( shortcut );
				if ( wrapper ) {
					wrappers.delete( shortcut );
					parentShortcuts.delete( wrapper );
				}
			},
		};
	}, [ parentShortcuts, pageKey ] );

	return (
		<PageKeyContext.Provider value={ pageKey }>
			<ShortcutContext.Provider value={ shortcuts }>
				<CommandsDisabledContext.Provider value={ ! isVisible }>
					{ children }
				</CommandsDisabledContext.Provider>
			</ShortcutContext.Provider>
		</PageKeyContext.Provider>
	);
}
