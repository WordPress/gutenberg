/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Component,
	createRef,
	createHigherOrderComponent,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Listener from './listener';

/**
 * Listener instance responsible for managing document event handling.
 *
 * @type {Listener}
 */
const listener = new Listener();

function withGlobalEvents( eventTypesToHandlers ) {
	return createHigherOrderComponent( ( WrappedComponent ) => {
		return class extends Component {
			constructor() {
				super( ...arguments );

				this.handleEvent = this.handleEvent.bind( this );

				this.ref = createRef();
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
				if ( typeof this.ref.current[ handler ] === 'function' ) {
					this.ref.current[ handler ]( event );
				}
			}

			render() {
				return <WrappedComponent ref={ this.ref } { ...this.props } />;
			}
		};
	}, 'withGlobalEvents' );
}

export default withGlobalEvents;
