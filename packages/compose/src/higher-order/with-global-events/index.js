/**
 * WordPress dependencies
 */
import { useEffect, useRef, forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import Listener from './listener';

/**
 * Listener instance responsible for managing document event handling.
 */
const listener = new Listener();

/**
 * Higher-order component creator which, given an object of DOM event types and
 * values corresponding to a callback function name on the component, will
 * create or update a window event handler to invoke the callback when an event
 * occurs. On behalf of the consuming developer, the higher-order component
 * manages unbinding when the component unmounts, and binding at most a single
 * event handler for the entire application.
 *
 * @deprecated
 *
 * @param {Record<keyof GlobalEventHandlersEventMap, string>} eventTypesToHandlers Object with keys of DOM
 *                                                                                 event type, the value a
 *                                                                                 name of the function on
 *                                                                                 the original component's
 *                                                                                 instance which handles
 *                                                                                 the event.
 *
 * @return {any} Higher-order component.
 */
export default function withGlobalEvents( eventTypesToHandlers ) {
	deprecated( 'wp.compose.withGlobalEvents', {
		since: '5.7',
		alternative: 'useEffect',
	} );

	return createHigherOrderComponent( ( WrappedComponent ) => {
		function Wrapper( /** @type {any} */ { ownProps, forwardedRef } ) {
			/** @type {any} */
			const wrappedRef = useRef( null );

			useEffect( () => {
				Object.keys( eventTypesToHandlers ).forEach( ( eventType ) => {
					listener.add( eventType, { handleEvent } );
				} );

				return () => {
					Object.keys( eventTypesToHandlers ).forEach(
						( eventType ) => {
							listener.remove( eventType, { handleEvent } );
						}
					);
				};
			}, [] );

			function handleEvent( /** @type {any} */ event ) {
				const handler =
					eventTypesToHandlers[
						/** @type {keyof GlobalEventHandlersEventMap} */ (
							event.type
						)
					];
				if (
					wrappedRef.current &&
					typeof wrappedRef.current[ handler ] === 'function'
				) {
					wrappedRef.current[ handler ]( event );
				}
			}

			function handleRef( /** @type {any} */ el ) {
				wrappedRef.current = el;
				if ( forwardedRef ) {
					forwardedRef( el );
				}
			}

			return <WrappedComponent { ...ownProps } ref={ handleRef } />;
		}

		return forwardRef( ( props, ref ) => {
			return <Wrapper ownProps={ props } forwardedRef={ ref } />;
		} );
	}, 'withGlobalEvents' );
}
