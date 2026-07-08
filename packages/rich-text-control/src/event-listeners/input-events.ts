/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

/**
 * Internal dependencies
 */
import type { EventListenersProps } from '../types';

export default ( props: MutableRefObject< EventListenersProps > ) =>
	( element: HTMLElement ) => {
		const { inputEvents } = props.current;
		function onInput( event: Event ) {
			for ( const inputEventHandler of inputEvents.current ) {
				inputEventHandler( event );
			}
		}

		element.addEventListener( 'input', onInput );
		return () => {
			element.removeEventListener( 'input', onInput );
		};
	};
