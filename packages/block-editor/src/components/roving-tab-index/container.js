/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RovingTabIndexProvider } from './context';

function RovingTabIndexContainer( { children, ...props } ) {
	const [ lastFocusedElement, setLastFocusedElement ] = useState();

	return (
		<RovingTabIndexProvider value={ lastFocusedElement }>
			<div onFocus={ ( event ) => setLastFocusedElement( event.target ) } { ...props }>
				{ children }
			</div>
		</RovingTabIndexProvider>
	);
}

export default RovingTabIndexContainer;
