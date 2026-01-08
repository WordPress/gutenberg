// @ts-nocheck
import { useCallback, useEffect, useRef } from '@wordpress/element';

function createRefRecord( ref ) {
	if ( typeof ref === 'function' ) {
		let cleanup = null;

		return {
			ref,
			attach( node ) {
				const ret = ref( node );
				if ( typeof ret === 'function' ) {
					cleanup = ret;
				}
			},
			detach() {
				if ( cleanup ) {
					cleanup();
					cleanup = null;
				} else {
					ref( null );
				}
			},
		};
	}

	if ( ref && typeof ref === 'object' ) {
		return {
			ref,
			attach: ( node ) => ( ref.current = node ),
			detach: () => ( ref.current = null ),
		};
	}

	return null;
}

function createRefEffectReconciler() {
	let node = null;
	let records = [];

	return {
		attach( nextNode ) {
			if ( node === nextNode ) {
				return;
			}

			if ( node ) {
				records.forEach( ( r ) => r.detach() );
			}
			node = nextNode;
			if ( node ) {
				records.forEach( ( r ) => r.attach( node ) );
			}
		},

		update( nextRefs ) {
			const next = nextRefs.map( createRefRecord );
			const len = Math.max( records.length, next.length );

			for ( let i = 0; i < len; i++ ) {
				const prev = records[ i ];
				const curr = next[ i ];

				if ( prev?.ref === curr?.ref ) {
					next[ i ] = prev;
				} else {
					prev?.detach();
					if ( curr && node ) {
						curr.attach( node );
					}
				}
			}

			records = next.filter( Boolean );
		},

		detach() {
			records.forEach( ( r ) => r.detach() );
			records = [];
			node = null;
		},
	};
}

/**
 * Merges refs into one ref callback.
 *
 * It also ensures that the merged ref callbacks are only called when they
 * change (as a result of a `useCallback` dependency update) OR when the ref
 * value changes, just as React does when passing a single ref callback to the
 * component.
 *
 * As expected, if you pass a new function on every render, the ref callback
 * will be called after every render.
 *
 * If you don't wish a ref callback to be called after every render, wrap it
 * with `useCallback( callback, dependencies )`. When a dependency changes, the
 * old ref callback will be called with `null` and the new ref callback will be
 * called with the same value.
 *
 * To make ref callbacks easier to use, you can also pass the result of
 * `useRefEffect`, which makes cleanup easier by allowing you to return a
 * cleanup function instead of handling `null`.
 *
 * It's also possible to _disable_ a ref (and its behaviour) by simply not
 * passing the ref.
 *
 * ```jsx
 * const ref = useRefEffect( ( node ) => {
 *   node.addEventListener( ... );
 *   return () => {
 *     node.removeEventListener( ... );
 *   };
 * }, [ ...dependencies ] );
 * const otherRef = useRef();
 * const mergedRefs useMergeRefs( [
 *   enabled && ref,
 *   otherRef,
 * ] );
 * return <div ref={ mergedRefs } />;
 * ```
 *
 * @template {import('react').Ref<any>} TRef
 * @param {Array<TRef>} refs The refs to be merged.
 *
 * @return {import('react').RefCallback<TypeFromRef<TRef>>} The merged ref callback.
 */
export default function useMergeRefs( refs ) {
	const reconcilerRef = useRef( null );

	if ( ! reconcilerRef.current ) {
		reconcilerRef.current = createRefEffectReconciler();
	}

	const reconciler = reconcilerRef.current;

	const mergedRef = useCallback(
		( node ) => {
			if ( node ) {
				reconciler.attach( node );
			} else {
				reconciler.detach();
			}
		},
		[ reconciler ]
	);

	useEffect( () => {
		reconciler.update( refs );
	}, [ refs, reconciler ] );

	useEffect( () => {
		return () => reconciler.detach();
	}, [ reconciler ] );

	return mergedRef;
}
