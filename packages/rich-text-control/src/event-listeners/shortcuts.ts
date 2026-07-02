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
		const { keyboardShortcuts } = props.current;
		function onKeyDown( event: KeyboardEvent ) {
			for ( const keyboardShortcut of keyboardShortcuts.current ) {
				keyboardShortcut( event );
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	};
