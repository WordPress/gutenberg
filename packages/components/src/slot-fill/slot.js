// @ts-nocheck
/**
 * WordPress dependencies
 */
import {
	Children,
	Component,
	cloneElement,
	isEmptyElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

class SlotComponent extends Component {
	constructor() {
		super( ...arguments );

		this.isUnmounted = false;
		this.bindNode = this.bindNode.bind( this );
	}

	componentDidMount() {
		const { registerSlot } = this.props;
		this.isUnmounted = false;
		registerSlot( this.props.name, this );
	}

	componentWillUnmount() {
		const { unregisterSlot } = this.props;
		this.isUnmounted = true;
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

	forceUpdate() {
		if ( this.isUnmounted ) {
			return;
		}
		super.forceUpdate();
	}

	render() {
		const { children, name, fillProps = {}, getFills } = this.props;

		const fills = ( getFills( name, this ) ?? [] )
			.map( ( fill ) => {
				const fillChildren = isFunction( fill.children )
					? fill.children( fillProps )
					: fill.children;

				return Children.map( fillChildren, ( child, childIndex ) => {
					if ( ! child || typeof child === 'string' ) {
						return child;
					}

					const childKey = child.key || childIndex;
					return cloneElement( child, { key: childKey } );
				} );
			} )
			.filter(
				// In some cases fills are rendered only when some conditions apply.
				// This ensures that we only use non-empty fills when rendering, i.e.,
				// it allows us to render wrappers only when the fills are actually present.
				( element ) => ! isEmptyElement( element )
			);

		return <>{ isFunction( children ) ? children( fills ) : fills }</>;
	}
}

const Slot = ( props ) => (
	<SlotFillContext.Consumer>
		{ ( { registerSlot, unregisterSlot, getFills } ) => (
			<SlotComponent
				{ ...props }
				registerSlot={ registerSlot }
				unregisterSlot={ unregisterSlot }
				getFills={ getFills }
			/>
		) }
	</SlotFillContext.Consumer>
);

export default Slot;
