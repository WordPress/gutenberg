/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';

class Fill extends Component {
	componentDidMount() {
		const { registerFill = noop } = this.context;

		registerFill( this.props.name, this );
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

	render() {
		const { getSlot = noop } = this.context;
		const { name, children } = this.props;

		const slot = getSlot( name );

		return slot ? createPortal( children, slot ) : null;
	}
}

Fill.contextTypes = {
	getSlot: noop,
	registerFill: noop,
	unregisterFill: noop,
};

export default Fill;
