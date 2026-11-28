import { Component, forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import Listener from './listener';
import type { WithGlobalEventsHOC, RefComponent, WrapperProps } from './types';

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
 * @param eventTypesToHandlers Object with keys of DOM event type, the value a
 *                             name of the function on the original component's
 *                             instance which handles the event.
 *
 * @return Higher-order component.
 */
export default function withGlobalEvents(
	eventTypesToHandlers: Partial<
		Record< keyof GlobalEventHandlersEventMap, string >
	>
) {
	deprecated( 'wp.compose.withGlobalEvents', {
		since: '5.7',
		alternative: 'useEffect',
	} );

	return createHigherOrderComponent( ( WrappedComponent: RefComponent ) => {
		class Wrapper extends Component< WrapperProps > {
			declare wrappedRef: Record< string, unknown > | null;

			constructor( props: WrapperProps ) {
				super( props );

				this.handleEvent = this.handleEvent.bind( this );
				this.handleRef = this.handleRef.bind( this );
			}

			componentDidMount() {
				Object.keys( eventTypesToHandlers ).forEach( ( eventType ) => {
					listener.add( eventType, this );
				} );
			}

			componentWillUnmount() {
				Object.keys( eventTypesToHandlers ).forEach( ( eventType ) => {
					listener.remove( eventType, this );
				} );
			}

			handleEvent( event: Event ) {
				const handler =
					eventTypesToHandlers[
						event.type as keyof GlobalEventHandlersEventMap
					]!;
				if ( typeof this.wrappedRef![ handler ] === 'function' ) {
					( this.wrappedRef![ handler ] as ( event: Event ) => void )(
						event
					);
				}
			}

			handleRef( el: Record< string, unknown > | null ) {
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

		return forwardRef( ( props: object, ref ) => {
			return (
				<Wrapper
					ownProps={ props }
					// Only callback refs are supported.
					forwardedRef={ ref as WrapperProps[ 'forwardedRef' ] }
				/>
			);
		} );
	}, 'withGlobalEvents' ) as WithGlobalEventsHOC;
}
