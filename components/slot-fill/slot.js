/**
 * External dependencies
 */
import { noop, map, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';

class Slot extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
	}

	componentDidMount() {
		const { registerSlot = noop } = this.context;

		registerSlot( this.props.name, this );
	}

	componentWillUnmount() {
		const { unregisterSlot = noop } = this.context;

		unregisterSlot( this.props.name, this );
	}

	componentWillReceiveProps( nextProps ) {
		const { name } = nextProps;
		const {
			unregisterSlot = noop,
			registerSlot = noop,
		} = this.context;

		if ( this.props.name !== name ) {
			unregisterSlot( this.props.name );
			registerSlot( name, this );
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	render() {
		const { name, bubblesVirtually = false, fillProps } = this.props;
		const { getFills = noop } = this.context;

		if ( bubblesVirtually ) {
			return <div ref={ this.bindNode } />;
		}

		return (
			<div ref={ this.bindNode }>
				{ map( getFills( name ), ( fill ) => {
					const fillKey = fill.occurrence;
					let { children } = fill.props;

					// If a function is passed as a child, render it with the fillProps.
					if ( isFunction( children ) ) {
						children = children( fillProps );
					}

					return (
						<Fragment key={ fillKey }>
							{ children }
						</Fragment>
					);
				} ) }
			</div>
		);
	}
}

Slot.contextTypes = {
	registerSlot: noop,
	unregisterSlot: noop,
	getFills: noop,
};

export default Slot;
