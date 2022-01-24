/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import Listener from './listener';

/**
 * Listener instance responsible for managing document event handling.
 */
const listener = new Listener();

/* eslint-disable jsdoc/no-undefined-types */
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

	// @ts-ignore We don't need to fix the type-related issues because this is deprecated.
	return createHigherOrderComponent( ( WrappedComponent ) => {
		class Wrapper extends Component {
			constructor( /** @type {any} */ props ) {
				super( props );

				this.handleEvent = this.handleEvent.bind( this );
				this.handleRef = this.handleRef.bind( this );
			}

			componentDidMount() {
				forEach( eventTypesToHandlers, ( _, eventType ) => {
					listener.add( eventType, this );
				} );
			}

			componentWillUnmount() {
				forEach( eventTypesToHandlers, ( _, eventType ) => {
					listener.remove( eventType, this );
				} );
			}

			handleEvent( /** @type {any} */ event ) {
				const handler =
					eventTypesToHandlers[
						/** @type {keyof GlobalEventHandlersEventMap} */ ( event.type )
						/* eslint-enable jsdoc/no-undefined-types */
					];
				if ( typeof this.wrappedRef[ handler ] === 'function' ) {
					this.wrappedRef[ handler ]( event );
				}
			}

			handleRef( /** @type {any} */ el ) {
				this.wrappedRef = el;
				// Any component using `withGlobalEvents` that is not setting a `ref`
				// will cause `this.props.forwardedRef` to be `null`, so we need this
				// check.
				if ( this.props.forwardedRef ) {
					this.props.forwardedRef( el );
				}
			}

			render() {
				return (
					<WrappedComponent
						{ ...this.props.ownProps }
						ref={ this.handleRef }
					/>
				);
			}
		}

		return forwardRef( ( props, ref ) => {
			return <Wrapper ownProps={ props } forwardedRef={ ref } />;
		} );
	}, 'withGlobalEvents' );
}
