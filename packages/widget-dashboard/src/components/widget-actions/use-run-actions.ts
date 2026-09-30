import { useCallback, useState } from '@wordpress/element';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';

const NONE: ReadonlySet< string > = new Set();

function isThenable( value: unknown ): value is PromiseLike< unknown > {
	return (
		typeof ( value as PromiseLike< unknown > | null )?.then === 'function'
	);
}

/**
 * Runs a surface's callback actions and tracks, by `id`, the ones whose
 * promise has not settled. The state outlives the controls the surface
 * mounts and unmounts.
 */
export function useRunActions(): {
	run: ( action: WidgetCallbackAction ) => Promise< void >;
	pendingIds: ReadonlySet< string >;
} {
	const [ pendingIds, setPendingIds ] = useState( NONE );

	const run = useCallback( async ( action: WidgetCallbackAction ) => {
		const result = action.callback();
		if ( ! isThenable( result ) ) {
			return;
		}

		setPendingIds( ( ids ) => new Set( ids ).add( action.id ) );
		try {
			await result;
		} finally {
			setPendingIds( ( ids ) => {
				const next = new Set( ids );
				next.delete( action.id );
				return next;
			} );
		}
	}, [] );

	return { run, pendingIds };
}
