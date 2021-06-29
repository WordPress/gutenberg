/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VIEW_ROOT } from './constants';
import { GlobalStylesNavigationContext } from './context';

export default function GlobalStylesNavigation( { children } ) {
	const [ currentView, setCurrentView ] = useState( VIEW_ROOT );

	return (
		<GlobalStylesNavigationContext.Provider
			value={ { currentView, setCurrentView } }
		>
			{ children }
		</GlobalStylesNavigationContext.Provider>
	);
}
