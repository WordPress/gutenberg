/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getSelectionRoot } from './utils';

/**
 * Whenever content editable is enabled on writing flow, it will have focus, so
 * we need to dispatch some events to the root of the selection to ensure
 * compatibility with rich text. In the future, perhaps the rich text event
 * handlers should be attached to the window instead.
 *
 * Alternatively, we could try to find a way to always maintain rich text focus.
 */
export default function useEventRedirect() {
	return useRefEffect( ( node ) => {
		function onInput( event ) {
			if ( event.target !== node ) {
				return;
			}

			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;
			const prototype = Object.getPrototypeOf( event );
			const constructorName = prototype.constructor.name;
			const Constructor = defaultView[ constructorName ];
			const root = getSelectionRoot( ownerDocument );

			if ( ! root || root === node ) {
				return;
			}

			const init = {};

			for ( const key in event ) {
				init[ key ] = event[ key ];
			}

			init.bubbles = false;

			const newEvent = new Constructor( event.type, init );
			const cancelled = ! root.dispatchEvent( newEvent );

			if ( cancelled ) {
				event.preventDefault();
			}
		}

		const events = [
			'beforeinput',
			'input',
			'compositionstart',
			'compositionend',
			'compositionupdate',
			'keydown',
		];

		events.forEach( ( eventType ) => {
			node.addEventListener( eventType, onInput );
		} );

		return () => {
			events.forEach( ( eventType ) => {
				node.removeEventListener( eventType, onInput );
			} );
		};
	}, [] );
}
