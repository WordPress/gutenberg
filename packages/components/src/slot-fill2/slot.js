/**
 * WordPress dependencies
 */
import { useEffect, useRef, useLayoutEffect } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { useSlotFillContext, useSlot } from './context';

export default function Slot( {
	name,
	fillProps = {},
	as: Component = 'div',
	...props
} ) {
	const registry = useSlotFillContext();
	const ref = useRef();
	const slot = useSlot( name );
	const propsAreEqual = slot && isShallowEqual( slot.fillProps, fillProps );

	useEffect( () => {
		registry.register( name, ref, fillProps );
		return () => {
			registry.unregister( name );
		};
	}, [ name ] );

	useLayoutEffect( () => {
		if ( slot && ! propsAreEqual ) {
			registry.update( name, ref, fillProps );
		}
	}, [ slot, propsAreEqual, fillProps ] );

	return <Component ref={ ref } { ...props } />;
}
