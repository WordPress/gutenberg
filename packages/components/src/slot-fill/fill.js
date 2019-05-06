/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Consumer } from './context';

let occurrences = 0;

class FillComponent extends Component {
	constructor() {
		super( ...arguments );
		this.occurrence = ++occurrences;
	}

	componentDidMount() {
		const { registerFill } = this.props;

		registerFill( this.props.name, this );
	}

	componentWillUpdate() {
		if ( ! this.occurrence ) {
			this.occurrence = ++occurrences;
		}
		const { getSlot } = this.props;
		const slot = getSlot( this.props.name );
		if ( slot && ! slot.props.bubblesVirtually ) {
			slot.forceUpdate();
		}
	}

	componentWillUnmount() {
		const { unregisterFill } = this.props;

		unregisterFill( this.props.name, this );
	}

	componentDidUpdate( prevProps ) {
		const { name, unregisterFill, registerFill } = this.props;

		if ( prevProps.name !== name ) {
			unregisterFill( prevProps.name, this );
			registerFill( name, this );
		}
	}

	resetOccurrence() {
		this.occurrence = null;
	}

	render() {
		const { name, getSlot } = this.props;
		let { children } = this.props;
		const slot = getSlot( name );

		if ( ! slot || ! slot.node || ! slot.props.bubblesVirtually ) {
			return null;
		}

		// If a function is passed as a child, provide it with the fillProps.
		if ( isFunction( children ) ) {
			children = children( slot.props.fillProps );
		}

		return createPortal( children, slot.node );
	}
}

const Fill = ( props ) => (
	<Consumer>
		{ ( { getSlot, registerFill, unregisterFill } ) => (
			<FillComponent
				{ ...props }
				getSlot={ getSlot }
				registerFill={ registerFill }
				unregisterFill={ unregisterFill }
			/>
		) }
	</Consumer>
);

export default Fill;
