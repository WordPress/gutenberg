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
	}

	unregisterSlot( name ) {
		delete this.slots[ name ];
	}

	unregisterFill( name, instance ) {
		this.fills[ name ] = without(
			this.fills[ name ],
			instance
		);
	}

	getSlot( name ) {
		return this.slots[ name ];
	}

	forceUpdateFills( name ) {
		if ( this.fills.hasOwnProperty( name ) ) {
			this.fills[ name ].forEach( ( instance ) => {
				instance.forceUpdate();
			} );
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
};

export default SlotFillProvider;
