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
import type { BaseSlotProps, SlotComponentProps } from './types';
/**
 * External dependencies
 */
import type { ReactElement } from 'react';

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc: any ): maybeFunc is Function {
	return typeof maybeFunc === 'function';
}

class SlotComponent extends Component< SlotComponentProps > {
	private isUnmounted: boolean;

	constructor( props: SlotComponentProps ) {
		super( props );

		this.isUnmounted = false;
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

	componentDidUpdate( prevProps: SlotComponentProps ) {
		const { name, unregisterSlot, registerSlot } = this.props;

		if ( prevProps.name !== name ) {
			// TODO: Check if adding `this` works correctly. @torounit
			unregisterSlot( prevProps.name, this );
			registerSlot( name, this );
		}
	}

	forceUpdate() {
		if ( this.isUnmounted ) {
			return;
		}
		super.forceUpdate();
	}

	render() {
		const { children, name, fillProps = {}, getFills } = this.props;

		const fills: ( ReactElement | string )[][] = (
			getFills( name, this ) ?? []
		)
			.map( ( fill ) => {
				const fillChildren = isFunction( fill.children )
					? fill.children( fillProps )
					: fill.children;
				return Children.map( fillChildren, ( child, childIndex ) => {
					if ( ! child || typeof child === 'string' ) {
						return child;
					}

					const childKey = child?.key || childIndex;
					return cloneElement( child as ReactElement, {
						key: childKey,
					} );
				} );
			} )
			.filter(
				// In some cases fills are rendered only when some conditions apply.
				// This ensures that we only use non-empty fills when rendering, i.e.,
				// it allows us to render wrappers only when the fills are actually present.
				( element ): element is Exclude< typeof element, undefined > =>
					! isEmptyElement( element )
			);

		return <>{ isFunction( children ) ? children( fills ) : fills }</>;
	}
}

const Slot = ( props: BaseSlotProps ) => (
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
