/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigatorContext } from '../context';
import type { NavigatorProviderProps, NavigatorPath } from '../types';

function NavigatorProvider( {
	initialPath,
	children,
}: NavigatorProviderProps ) {
	const [ path, setPath ] = useState< NavigatorPath >( {
		path: initialPath,
	} );

	return (
		<NavigatorContext.Provider value={ [ path, setPath ] }>
			{ children }
		</NavigatorContext.Provider>
	);
}

// TODO: context connect

export default NavigatorProvider;
