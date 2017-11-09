/**
 * External dependencies
 */
import { pick, without, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

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
	}

	getChildContext() {
		return pick( this, [
			'registerSlot',
			'registerFill',
			'unregisterSlot',
			'unregisterFill',
			'getSlot',
			'getFills',
		] );
	}

	registerSlot( name, node ) {
		this.slots[ name ] = node;
		this.forceUpdateFills( name );
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
		this.forceUpdateSlot( name );
	}

	getSlot( name ) {
		return this.slots[ name ];
	}

	getFills( name ) {
		return this.fills[ name ];
	}

	forceUpdateFills( name ) {
		if ( this.fills.hasOwnProperty( name ) ) {
			this.fills[ name ].forEach( ( instance ) => {
				instance.forceUpdate();
			} );
		}
	}

	forceUpdateSlot( name ) {
		const slot = this.getSlot( name );
		if ( slot ) {
			slot.forceUpdate();
		}
	}

	render() {
		return this.props.children;
	}
}

SlotFillProvider.childContextTypes = {
	registerSlot: noop,
	unregisterSlot: noop,
	registerFill: noop,
	unregisterFill: noop,
	getSlot: noop,
	getFills: noop,
};

export default SlotFillProvider;
