/**
 * External dependencies
 */
import {
	isFunction,
	isString,
	map,
	negate,
} from 'lodash';

/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';
import {
	Children,
	Component,
	cloneElement,
	isEmptyElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Consumer } from './context';

class SlotComponent extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
	}

	componentDidMount() {
		const { registerSlot } = this.props;
		this._isMounted = true;

		registerSlot( this.props.name, this );
	}

	componentWillUnmount() {
		const { unregisterSlot } = this.props;
		this._isMounted = false;

		unregisterSlot( this.props.name, this );
	}

	componentDidUpdate( prevProps ) {
		const { name, fillProps, unregisterSlot, registerSlot } = this.props;

		if ( prevProps.name !== name || ! isShallowEqual( prevProps.fillProps, fillProps ) ) {
			unregisterSlot( prevProps.name );
			registerSlot( name, this );
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	forceUpdate() {
		// Fill may call this when the Slot has been already unmounted.
		// The overall Slot/Fill technique needs to be revisited.
		// This only avoids React warnings.
		if ( this._isMounted ) {
			return super.forceUpdate();
		}
	}

	render() {
		const { children, name, bubblesVirtually = false, fillProps = {}, getFills, className } = this.props;

		if ( bubblesVirtually ) {
			return <div ref={ this.bindNode } className={ className } />;
		}

		const fills = map( getFills( name, this ), ( fill ) => {
			const fillKey = fill.occurrence;
			const fillChildren = isFunction( fill.children ) ? fill.children( fillProps ) : fill.children;

			return Children.map( fillChildren, ( child, childIndex ) => {
				if ( ! child || isString( child ) ) {
					return child;
				}

				const childKey = `${ fillKey }---${ child.key || childIndex }`;
				return cloneElement( child, { key: childKey } );
			} );
		} ).filter(
			// In some cases fills are rendered only when some conditions apply.
			// This ensures that we only use non-empty fills when rendering, i.e.,
			// it allows us to render wrappers only when the fills are actually present.
			negate( isEmptyElement )
		);

		return (
			<>
				{ isFunction( children ) ? children( fills ) : fills }
			</>
		);
	}
}

const Slot = ( props ) => (
	<Consumer>
		{ ( { registerSlot, unregisterSlot, getFills } ) => (
			<SlotComponent
				{ ...props }
				registerSlot={ registerSlot }
				unregisterSlot={ unregisterSlot }
				getFills={ getFills }
			/>
		) }
	</Consumer>
);

export default Slot;
