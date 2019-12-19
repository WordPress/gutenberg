/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { useSlotFillContext, useSlot } from './context';

export default function Slot( { name, fillProps = {}, ...props } ) {
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

	useEffect( () => {
		if ( slot && ! propsAreEqual ) {
			registry.update( name, ref, fillProps );
		}
	}, [ slot, propsAreEqual, fillProps ] );

	return <div ref={ ref } { ...props } />;
}
