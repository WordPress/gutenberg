/**
 * WordPress dependencies
 */
import { useObservableValue } from '@wordpress/compose';
import {
	useContext,
	useLayoutEffect,
	useRef,
	createPortal,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type { FillComponentProps } from './types';
import StyleProvider from '../style-provider';

export default function Fill( { name, children }: FillComponentProps ) {
	const registry = useContext( SlotFillContext );
	const instanceRef = useRef( {} );
	const childrenRef = useRef( children );

	useLayoutEffect( () => {
		childrenRef.current = children;
	}, [ children ] );

	useLayoutEffect( () => {
		const instance = instanceRef.current;
		registry.registerFill( name, {
			instance,
			children: childrenRef.current,
		} );
		return () => registry.unregisterFill( name, instance );
	}, [ registry, name ] );

	useLayoutEffect( () => {
		registry.updateFill( name, {
			instance: instanceRef.current,
			children: childrenRef.current,
		} );
	} );

	const slot = useObservableValue( registry.slots, name );

	if ( ! slot ) {
		return null;
	}

	if ( slot.type === 'children' ) {
		return null;
	}

	const portalEl = slot.ref.current;
	if ( ! portalEl ) {
		return null;
	}

	const wrappedChildren =
		typeof children === 'function'
			? children( slot.fillProps ?? {} )
			: children;

	// When using a `Fill`, the `children` will be rendered in the document of the
	// `Slot`. This means that we need to wrap the `children` in a `StyleProvider`
	// to make sure we're referencing the right document/iframe (instead of the
	// context of the `Fill`'s parent).
	return createPortal(
		<StyleProvider document={ portalEl.ownerDocument }>
			{ wrappedChildren }
		</StyleProvider>,
		portalEl
	);
}
