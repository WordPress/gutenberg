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
import {
	Children,
	Component,
	cloneElement,
	Fragment,
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

		registerSlot( this.props.name, this );
	}

	componentWillUnmount() {
		const { unregisterSlot } = this.props;

		unregisterSlot( this.props.name, this );
	}

	componentDidUpdate( prevProps ) {
		const { name, unregisterSlot, registerSlot } = this.props;

		if ( prevProps.name !== name ) {
			unregisterSlot( prevProps.name );
			registerSlot( name, this );
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	render() {
		const { children, name, bubblesVirtually = false, fillProps = {}, getFills } = this.props;

		if ( bubblesVirtually ) {
			return <div ref={ this.bindNode } />;
		}

		const fills = map( getFills( name, this ), ( fill ) => {
			const fillKey = fill.occurrence;
			const fillChildren = isFunction( fill.props.children ) ? fill.props.children( fillProps ) : fill.props.children;

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
			<Fragment>
				{ isFunction( children ) ? children( fills ) : fills }
			</Fragment>
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
