/**
 * External dependencies
 */
import { noop, map, isString, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Component,
	Children,
	Fragment,
	cloneElement,
	createRef,
} from '@wordpress/element';

class Slot extends Component {
	constructor() {
		super( ...arguments );

		this.virtualTarget = createRef();
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

	render() {
		const { children, name, bubblesVirtually, fillProps = {} } = this.props;
		const { getFills = noop } = this.context;

		if ( bubblesVirtually ) {
			// When bubbling virtually, createPortal requires a DOM node in
			// which to render the fill elements. This `div` serves no purpose
			// other than to act as the target container.
			return <div ref={ this.virtualTarget } role="presentation" />;
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
		} );

		return (
			<Fragment>
				{ isFunction( children ) ? children( fills.filter( Boolean ) ) : fills }
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
