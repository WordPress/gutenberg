/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import Listener from './listener';

/**
 * Listener instance responsible for managing document event handling.
 *
 * @type {Listener}
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
 * @param {Object<string,string>} eventTypesToHandlers Object with keys of DOM
 *                                                     event type, the value a
 *                                                     name of the function on
 *                                                     the original component's
 *                                                     instance which handles
 *                                                     the event.
 *
 * @return {Function} Higher-order component.
 */
function withGlobalEvents( eventTypesToHandlers ) {
	return createHigherOrderComponent( ( WrappedComponent ) => {
		class Wrapper extends Component {
			constructor() {
				super( ...arguments );

				this.handleEvent = this.handleEvent.bind( this );
				this.handleRef = this.handleRef.bind( this );
			}

			componentDidMount() {
				forEach( eventTypesToHandlers, ( handler, eventType ) => {
					listener.add( eventType, this );
				} );
			}

			componentWillUnmount() {
				forEach( eventTypesToHandlers, ( handler, eventType ) => {
					listener.remove( eventType, this );
				} );
			}

			handleEvent( event ) {
				const handler = eventTypesToHandlers[ event.type ];
				if ( typeof this.wrappedRef[ handler ] === 'function' ) {
					this.wrappedRef[ handler ]( event );
				}
			}

			handleRef( el ) {
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

export default withGlobalEvents;
