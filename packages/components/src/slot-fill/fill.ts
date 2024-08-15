/**
 * WordPress dependencies
 */
import { useContext, useLayoutEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import useSlot from './use-slot';
import type { FillComponentProps } from './types';

export default function Fill( { name, children }: FillComponentProps ) {
	const { registerFill, unregisterFill } = useContext( SlotFillContext );
	const slot = useSlot( name );

	const ref = useRef( {
		name,
		children,
	} );

	useLayoutEffect( () => {
		const refValue = ref.current;
		registerFill( name, refValue );
		return () => unregisterFill( name, refValue );
		// Ignore reason: the useLayoutEffects here are written to fire at specific times, and introducing new dependencies could cause unexpected changes in behavior.
		// We'll leave them as-is until a more detailed investigation/refactor can be performed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useLayoutEffect( () => {
		ref.current.children = children;
		if ( slot ) {
			slot.forceUpdate();
		}
		// Ignore reason: the useLayoutEffects here are written to fire at specific times, and introducing new dependencies could cause unexpected changes in behavior.
		// We'll leave them as-is until a more detailed investigation/refactor can be performed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ children ] );

	useLayoutEffect( () => {
		if ( name === ref.current.name ) {
			// Ignore initial effect.
			return;
		}
		unregisterFill( ref.current.name, ref.current );
		ref.current.name = name;
		registerFill( name, ref.current );
		// Ignore reason: the useLayoutEffects here are written to fire at specific times, and introducing new dependencies could cause unexpected changes in behavior.
		// We'll leave them as-is until a more detailed investigation/refactor can be performed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ name ] );

	return null;
}
