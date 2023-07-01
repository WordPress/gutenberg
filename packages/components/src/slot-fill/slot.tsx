/**
 * External dependencies
 */
import type { ReactElement, ReactNode } from 'react';

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
import type { BaseSlotComponentProps, SlotComponentProps } from './types';

/**
 * Whether the argument is a function.
 *
 * @param maybeFunc The argument to check.
 * @return True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc: any ): maybeFunc is Function {
	return typeof maybeFunc === 'function';
}

class SlotComponent extends Component< BaseSlotComponentProps, {} > {
	private isUnmounted: boolean;

	constructor( props: BaseSlotComponentProps ) {
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

	componentDidUpdate( prevProps: BaseSlotComponentProps ) {
		const { name, unregisterSlot, registerSlot } = this.props;

		if ( prevProps.name !== name ) {
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
		const fills: ReactNode[] = ( getFills( name, this ) ?? [] )
			.map( ( fill ) => {
				const fillChildren = isFunction( fill.children )
					? fill.children( fillProps )
					: fill.children;
				return Children.map( fillChildren, ( child, childIndex ) => {
					if ( ! child || typeof child === 'string' ) {
						return child;
					}
					let childKey: string | number = childIndex;
					if (
						typeof child === 'object' &&
						'key' in child &&
						child?.key
					) {
						childKey = child.key;
					}

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

const Slot = ( props: Omit< SlotComponentProps, 'bubblesVirtually' > ) => (
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
