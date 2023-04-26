// @ts-nocheck
/**
 * WordPress dependencies
 */
import {
	useRef,
	useLayoutEffect,
	useContext,
	useState,
	useEffect,
	forwardRef,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

function useForceUpdate( ref ) {
	const [ state, setState ] = useState( true );
	const mounted = useRef( true );

	useEffect( () => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, [] );

	return {
		val: state,
		rerenderSlot() {
			if ( mounted.current ) {
				setState( false );
				ref.current = null;
				console.log( ref, `${ state }` );
				setTimeout( () => {
					setState( true );
				}, 1000 );
			}
		},
	};
}

function Slot(
	{ name, fillProps = {}, as: Component = 'div', ...props },
	forwardedRef
) {
	const { registerSlot, unregisterSlot, ...registry } =
		useContext( SlotFillContext );
	const ref = useRef();
	const { val, rerenderSlot } = useForceUpdate( ref );

	useLayoutEffect( () => {
		registerSlot( name, ref, { ...fillProps, rerenderSlot } );
		return () => {
			unregisterSlot( name, ref );
		};
		// Ignore reason: We don't want to unregister and register the slot whenever
		// `fillProps` change, which would cause the fill to be re-mounted. Instead,
		// we can just update the slot (see hook below).
		// For more context, see https://github.com/WordPress/gutenberg/pull/44403#discussion_r994415973
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ registerSlot, unregisterSlot, rerenderSlot, name ] );
	// fillProps may be an update that interacts with the layout, so we
	// useLayoutEffect.
	useLayoutEffect( () => {
		registry.updateSlot( name, { ...fillProps, rerenderSlot } );
	} );

	const mergedRefs = useMergeRefs( [ forwardedRef, ref ] );

	if ( ! val ) {
		return null;
	}

	return <Component ref={ mergedRefs } { ...props } />;
}

export default forwardRef( Slot );
