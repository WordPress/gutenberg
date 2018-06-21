/**
 * External dependencies
 */
import { noop, map, isString, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement } from '@wordpress/element';

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

	componentDidUpdate( prevProps ) {
		const { name } = this.props;
		const {
			unregisterSlot = noop,
			registerSlot = noop,
		} = this.context;

		if ( prevProps.name !== name ) {
			unregisterSlot( prevProps.name );
			registerSlot( name, this );
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	render() {
		const { children, name, bubblesVirtually = false, fillProps = {} } = this.props;
		const { getFills = noop } = this.context;

		if ( bubblesVirtually ) {
			return <div ref={ this.bindNode } />;
		}

		const fills = map( getFills( name ), ( fill ) => {
			const fillKey = fill.occurrence;

			// If a function is passed as a child, render it with the fillProps.
			if ( isFunction( fill.props.children ) ) {
				return cloneElement( fill.props.children( fillProps ), { key: fillKey } );
			}

			return Children.map( fill.props.children, ( child, childIndex ) => {
				if ( ! child || isString( child ) ) {
					return child;
				}

				const childKey = `${ fillKey }---${ child.key || childIndex }`;
				return cloneElement( child, { key: childKey } );
			} );
		} );

		return (
			<div ref={ this.bindNode }>
				{ isFunction( children ) ? children( fills.filter( Boolean ) ) : fills }
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
