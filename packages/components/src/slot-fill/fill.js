/**
 * External dependencies
 */
import { noop, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';

let occurrences = 0;

class Fill extends Component {
	constructor() {
		super( ...arguments );
		this.occurrence = ++occurrences;
	}

	componentDidMount() {
		const { registerFill = noop } = this.context;

		registerFill( this.props.name, this );

		this.checkIfSlotAvailable();
	}

	componentWillUpdate() {
		if ( ! this.occurrence ) {
			this.occurrence = ++occurrences;
		}
		const { getSlot = noop } = this.context;
		const slot = getSlot( this.props.name );
		if ( slot && ! slot.props.bubblesVirtually ) {
			slot.forceUpdate();
		}
	}

	componentWillUnmount() {
		const { unregisterFill = noop } = this.context;

		unregisterFill( this.props.name, this );
	}

	componentDidUpdate( prevProps ) {
		const { name } = this.props;
		const {
			unregisterFill = noop,
			registerFill = noop,
		} = this.context;

		if ( prevProps.name !== name ) {
			unregisterFill( prevProps.name, this );
			registerFill( name, this );
		}

		this.checkIfSlotAvailable();
	}

	/**
	 * Forces an update if the target slot becomes available after the fill was
	 * rendered without the slot having yet been prepared. This can occur when
	 * the slot is mounted after the fill, or when the slot and fill render
	 * simultaneously and the Slot's portal target has not yet been mounted for
	 * the fill to use as a container.
	 */
	checkIfSlotAvailable() {
		const { getSlot = noop } = this.context;
		const { name } = this.props;
		if ( this.isPendingSlot && !! getSlot( name ) ) {
			this.forceUpdate();
		}
	}

	resetOccurrence() {
		this.occurrence = null;
	}

	render() {
		const { getSlot = noop } = this.context;
		const { name } = this.props;
		let { children } = this.props;

		const slot = getSlot( name );
		if ( ! slot ) {
			this.isPendingSlot = true;
			return null;
		}

		delete this.isPendingSlot;

		// A slot which does not bubble events virtually is responsible for
		// rendering its own fills.
		if ( ! slot.props.bubblesVirtually ) {
			return null;
		}

		// If a function is passed as a child, provide it with the fillProps.
		if ( isFunction( children ) ) {
			children = children( slot.props.fillProps );
		}

		return createPortal( children, slot.virtualTarget.current );
	}
}

Fill.contextTypes = {
	getSlot: noop,
	registerFill: noop,
	unregisterFill: noop,
};

export default Fill;
