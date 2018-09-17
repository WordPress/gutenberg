/**
 * External dependencies
 */
import {
	isFunction,
	isString,
	map,
	negate,
	noop,
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

Slot.contextTypes = {
	registerSlot: noop,
	unregisterSlot: noop,
	getFills: noop,
};

export default Slot;
