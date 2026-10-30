import { useEffect, useState } from '@wordpress/element';
import { ICON_NAMES, nameToSlug } from './manifest';

/**
 * Returns the window whose URL is shown in the address bar. Stories render in
 * an iframe, so the selected icon is kept in the hash of the manager URL,
 * where it can be shared as a link.
 */
function getTopWindow(): Window {
	try {
		// Throws if the manager is on another origin, e.g. a composed Storybook.
		void window.parent.location.href;
		return window.parent;
	} catch {
		return window;
	}
}

function getIconNameFromHash(): string | null {
	const slug = decodeURIComponent(
		getTopWindow().location.hash.replace( /^#/, '' )
	);
	return ICON_NAMES.find( ( name ) => nameToSlug( name ) === slug ) ?? null;
}

function setIconInHash( slug: string | null ) {
	const { history, location } = getTopWindow();
	const url = location.href.replace( /#.*$/, '' );
	history.replaceState(
		history.state,
		'',
		slug ? `${ url }#${ slug }` : url
	);
}

/**
 * Keeps the selected icon in sync with the URL hash.
 */
export function useSelectedIcon() {
	const [ selectedName, setSelectedName ] = useState( getIconNameFromHash );

	useEffect( () => {
		const topWindow = getTopWindow();
		const onHashChange = () => setSelectedName( getIconNameFromHash() );
		topWindow.addEventListener( 'hashchange', onHashChange );
		return () => {
			topWindow.removeEventListener( 'hashchange', onHashChange );
			// Drop the hash when leaving the story, so it doesn't stick to
			// the URL of other stories.
			setIconInHash( null );
		};
	}, [] );

	const selectIcon = ( name: string ) => {
		setSelectedName( name );
		setIconInHash( nameToSlug( name ) );
	};

	return { selectedName, selectIcon };
}
