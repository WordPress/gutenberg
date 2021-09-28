/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigatorContext } from '../context';

function NavigatorProvider( { initialPath, children } ) {
	const [ path, setPath ] = useState( { path: initialPath } );

	return (
		<NavigatorContext.Provider value={ [ path, setPath ] }>
			{ children }
		</NavigatorContext.Provider>
	);
}

export default NavigatorProvider;
