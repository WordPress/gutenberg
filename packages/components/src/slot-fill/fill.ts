/**
 * WordPress dependencies
 */
import { useContext, useLayoutEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type { FillComponentProps } from './types';

export default function Fill( { name, children }: FillComponentProps ) {
	const registry = useContext( SlotFillContext );
	const instanceRef = useRef( {} );
	const childrenRef = useRef( children );

	useLayoutEffect( () => {
		childrenRef.current = children;
	}, [ children ] );

	useLayoutEffect( () => {
		const instance = instanceRef.current;
		registry.registerFill( name, instance, childrenRef.current );
		return () => registry.unregisterFill( name, instance );
	}, [ registry, name ] );

	useLayoutEffect( () => {
		registry.updateFill( name, instanceRef.current, childrenRef.current );
	} );

	return null;
}
