/**
 * External dependencies
 */
import { pick, sortBy, forEach, without, noop } from 'lodash';

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

	registerSlot( name, slot ) {
		this.slots[ name ] = slot;

		// TODO: Track down when this case occurs, see if we can at least limit
		// it to specific variations of Slot/Fill. Needs test case.

		// Sometimes the fills are registered after the initial render of slot
		// But before the registerSlot call, we need to rerender the slot
		this.forceUpdateFillRenderingSlot( name );

		// A fill in a bubblesVirtually slot renders itself via createPortal.
		// If the slot was mounted after the fill, the fill needs update.
		if ( slot.props.bubblesVirtually ) {
			this.forceUpdateFills( name );
		}
	}

	registerFill( name, instance ) {
		this.fills[ name ] = [
			...( this.fills[ name ] || [] ),
			instance,
		];
		this.forceUpdateFillRenderingSlot( name );
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
		this.forceUpdateFillRenderingSlot( name );
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

	/**
	 * Forces update of a slot, if the slot is responsible for rendering fills
	 * of the given name. A slot renders its fills if its bubblesVirtually prop
	 * is not `true`; otherwise, the fill renders itself by createPortal.
	 *
	 * @param {string} name Name of fill-rendering slot to update.
	 */
	forceUpdateFillRenderingSlot( name ) {
		const slot = this.getSlot( name );

		if ( slot && ! slot.props.bubblesVirtually ) {
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
