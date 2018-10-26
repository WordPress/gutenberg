/**
 * External dependencies
 */
import { sortBy, forEach, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';

const { Provider } = createContext( {
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

		this.registerSlot = this.registerSlot.bind( this );
		this.registerFill = this.registerFill.bind( this );
		this.unregisterSlot = this.unregisterSlot.bind( this );
		this.unregisterFill = this.unregisterFill.bind( this );
		this.getSlot = this.getSlot.bind( this );
		this.getFills = this.getFills.bind( this );

		this.slots = {};
		this.fills = {};
		this.state = {
			registerSlot: this.registerSlot,
			unregisterSlot: this.unregisterSlot,
			registerFill: this.registerFill,
			unregisterFill: this.unregisterFill,
			getSlot: this.getSlot,
			getFills: this.getFills,
		};
	}

	registerSlot( name, slot ) {
		this.slots[ name ] = slot;
		this.forceUpdateFills( name );

		// Sometimes the fills are registered after the initial render of slot
		// But before the registerSlot call, we need to rerender the slot
		this.forceUpdateSlot( name );
	}

	registerFill( name, instance ) {
		this.fills[ name ] = [
			...( this.fills[ name ] || [] ),
			instance,
		];
		this.forceUpdateSlot( name );
	}

	unregisterSlot( name ) {
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

	getFills( name ) {
		return sortBy( this.fills[ name ], 'occurrence' );
	}

	resetFillOccurrence( name ) {
		forEach( this.fills[ name ], ( instance ) => {
			instance.resetOccurrence();
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

export default SlotFillProvider;
