/**
 * External dependencies
 */
import { sortBy, forEach, without, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const { Provider, Consumer } = createContext( {
	registerSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
	getSlot: () => {},
	getFills: () => {},
} );

class SlotFillProvider extends Component {
	constructor() {
		super( ...arguments );

		this.slots = {};
		this.fills = {};
		this.state = {
			registerSlot: this.proxy( 'registerSlot' ).bind( this ),
			registerFill: this.proxy( 'registerFill' ).bind( this ),
			unregisterSlot: this.proxy( 'unregisterSlot' ).bind( this ),
			unregisterFill: this.proxy( 'unregisterFill' ).bind( this ),
			getSlot: this.proxy( 'getSlot' ).bind( this ),
			getFills: this.proxy( 'getFills' ).bind( this ),
		};
	}

	/**
	 * Given a function name for a function on the SlotFillProvider prototype,
	 * returns a new function which either passes the arguments to the current
	 * instance, or to the context ancestor, dependent on whether the provider
	 * is configured to handle the given slot.
	 *
	 * @param {string} functionName SlotFillProvider function name.
	 *
	 * @return {Function} Proxying function.
	 */
	proxy( functionName ) {
		return ( name, ...args ) => {
			const { slots: handledSlots } = this.props;

			let handler = this[ functionName ];

			if ( Array.isArray( handledSlots ) ) {
				const isHandled = some( handledSlots, ( slotNameOrComponent ) => {
					const { slotName = slotNameOrComponent } = slotNameOrComponent;
					return typeof slotName === 'string' && (
						slotName === name ||
						name.startsWith( slotName + '.' )
					);
				} );

				if ( ! isHandled ) {
					handler = this.props[ functionName ];
				}
			}

			return handler.call( this, name, ...args );
		};
	}

	registerSlot( name, slot ) {
		const previousSlot = this.slots[ name ];
		this.slots[ name ] = slot;
		this.forceUpdateFills( name );

		// Sometimes the fills are registered after the initial render of slot
		// But before the registerSlot call, we need to rerender the slot
		this.forceUpdateSlot( name );

		// If a new instance of a slot is being mounted while another with the
		// same name exists, force its update _after_ the new slot has been
		// assigned into the instance, such that its own rendering of children
		// will be empty (the new Slot will subsume all fills for this name).
		if ( previousSlot ) {
			previousSlot.forceUpdate();
		}
	}

	registerFill( name, instance ) {
		this.fills[ name ] = [
			...( this.fills[ name ] || [] ),
			instance,
		];
		this.forceUpdateSlot( name );
	}

	unregisterSlot( name, instance ) {
		// If a previous instance of a Slot by this name unmounts, do nothing,
		// as the slot and its fills should only be removed for the current
		// known instance.
		if ( this.slots[ name ] !== instance ) {
			return;
		}

		delete this.slots[ name ];
		this.forceUpdateFills( name );
	}

	unregisterFill( name, instance ) {
		this.fills[ name ] = without(
			this.fills[ name ],
			instance
		);
		this.resetFillOccurrence( name );
		this.forceUpdateSlot( name );
	}

	getSlot( name ) {
		return this.slots[ name ];
	}

	getFills( name, slotInstance ) {
		// Fills should only be returned for the current instance of the slot
		// in which they occupy.
		if ( this.slots[ name ] !== slotInstance ) {
			return [];
		}
		return sortBy( this.fills[ name ], 'occurrence' );
	}

	resetFillOccurrence( name ) {
		forEach( this.fills[ name ], ( instance ) => {
			instance.occurrence = undefined;
		} );
	}

	forceUpdateFills( name ) {
		forEach( this.fills[ name ], ( instance ) => {
			instance.forceUpdate();
		} );
	}

	forceUpdateSlot( name ) {
		const slot = this.getSlot( name );

		if ( slot ) {
			slot.forceUpdate();
		}
	}

	render() {
		return (
			<Provider value={ this.state }>
				{ this.props.children }
			</Provider>
		);
	}
}

const withConsumerContext = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => (
		<Consumer>
			{ ( context ) => (
				<WrappedComponent
					{ ...props }
					registerSlot={ context.registerSlot }
					unregisterSlot={ context.unregisterSlot }
					registerFill={ context.registerFill }
					unregisterFill={ context.unregisterFill }
					getSlot={ context.getSlot }
					getFills={ context.getFills }
				/>
			) }
		</Consumer>
	),
	'withConsumerContext'
);

export default withConsumerContext( SlotFillProvider );

export { Consumer, withConsumerContext };
