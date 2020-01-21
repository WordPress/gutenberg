/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RovingTabIndexProvider } from './context';

const RovingTabIndexContainer = forwardRef( ( { children, ...props }, ref ) => {
	const [ lastFocusedElement, setLastFocusedElement ] = useState();

	return (
		<RovingTabIndexProvider value={ lastFocusedElement }>
			<div onFocus={ ( event ) => setLastFocusedElement( event.target ) } ref={ ref } { ...props }>
				{ children }
			</div>
		</RovingTabIndexProvider>
	);
} );

export default RovingTabIndexContainer;
