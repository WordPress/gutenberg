/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';

let occurrences = 0;

class Fill extends Component {
	componentWillMount() {
		this.occurrence = ++occurrences;
	}

	componentDidMount() {
		const { registerFill = noop } = this.context;

		registerFill( this.props.name, this );
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

	componentWillReceiveProps( nextProps ) {
		const { name } = nextProps;
		const {
			unregisterFill = noop,
			registerFill = noop,
		} = this.context;

		if ( this.props.name !== name ) {
			unregisterFill( this.props.name, this );
			registerFill( name, this );
		}
	}

	resetOccurrence() {
		this.occurrence = null;
	}

	render() {
		const { getSlot = noop } = this.context;
		const { name, children } = this.props;
		const slot = getSlot( name );
		// Todo: also make it work without bubblesVirtually?
		if ( ! slot || ! slot.props.bubblesVirtually ) {
			return null;
		}

		if ( slot.props.fillProps ) {
			// If the child is a function, pass the arguments of the slot to that function.
			if ( typeof this.props.children === 'function' ) {
				return this.props.children( slot.props.fillProps );
			}
		}

		return createPortal( children, slot.node );
	}
}

Fill.contextTypes = {
	getSlot: noop,
	registerFill: noop,
	unregisterFill: noop,
};

export default Fill;
