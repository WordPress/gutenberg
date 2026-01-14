/**
 * External dependencies
 */
import type { ReactElement, ReactNode, Key } from 'react';

/**
 * WordPress dependencies
 */
import { useObservableValue } from '@wordpress/compose';
import {
	useContext,
	useLayoutEffect,
	useRef,
	Children,
	cloneElement,
	isEmptyElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type { SlotComponentProps } from './types';

/**
 * Whether the argument is a function.
 *
 * @param maybeFunc The argument to check.
 * @return True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc: any ): maybeFunc is Function {
	return typeof maybeFunc === 'function';
}

function addKeysToChildren( children: ReactNode ) {
	return Children.map( children, ( child, childIndex ) => {
		if ( ! child || typeof child === 'string' ) {
			return child;
		}
		let childKey: Key = childIndex;
		if ( typeof child === 'object' && 'key' in child && child?.key ) {
			childKey = child.key;
		}

		return cloneElement( child as ReactElement, {
			key: childKey,
		} );
	} );
}

function Slot( props: Omit< SlotComponentProps, 'bubblesVirtually' > ) {
	const registry = useContext( SlotFillContext );
	const instanceRef = useRef( {} );

	const { name, children, fillProps = {} } = props;

	useLayoutEffect( () => {
		const instance = instanceRef.current;
		registry.registerSlot( name, instance );
		return () => registry.unregisterSlot( name, instance );
	}, [ registry, name ] );

	let fills = useObservableValue( registry.fills, name ) ?? [];
	const currentSlot = useObservableValue( registry.slots, name );

	// Fills should only be rendered in the currently registered instance of the slot.
	if ( currentSlot !== instanceRef.current ) {
		fills = [];
	}

	const renderedFills = fills
		.map( ( fill ) => {
			const fillChildren = isFunction( fill.children )
				? fill.children( fillProps )
				: fill.children;
			return addKeysToChildren( fillChildren );
		} )
		.filter(
			// In some cases fills are rendered only when some conditions apply.
			// This ensures that we only use non-empty fills when rendering, i.e.,
			// it allows us to render wrappers only when the fills are actually present.
			( element ) => ! isEmptyElement( element )
		);

	return (
		<>
			{ isFunction( children )
				? children( renderedFills )
				: renderedFills }
		</>
	);
}

export default Slot;
