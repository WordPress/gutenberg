/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class Slot extends Component {
	constructor() {
		super( ...arguments );

		this.registerSlot = this.registerSlot.bind( this );
	}

	componentWillUnmount() {
		const { unregisterSlot = noop } = this.context;

		unregisterSlot( this.props.name, this.node );
	}

	componentWillReceiveProps( nextProps ) {
		const { name } = nextProps;
		const {
			unregisterSlot = noop,
			registerSlot = noop,
		} = this.context;

		if ( this.props.name !== name ) {
			unregisterSlot( this.props.name );
			registerSlot( name, this.node );
		}
	}

	registerSlot( node ) {
		const { registerSlot = noop } = this.context;

		this.node = node;
		registerSlot( this.props.name, node );
	}

	render() {
		return <div ref={ this.registerSlot } />;
	}
}

Slot.contextTypes = {
	registerSlot: noop,
	unregisterSlot: noop,
};

export default Slot;
