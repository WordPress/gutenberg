import { useCallback, useState } from '@wordpress/element';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';

const NONE: ReadonlySet< string > = new Set();

function isThenable( value: unknown ): value is PromiseLike< unknown > {
	return (
		typeof ( value as PromiseLike< unknown > | null )?.then === 'function'
	);
}

/**
 * Runs the callback actions of one surface and tracks, by `id`, the ones
 * whose returned promise has not settled. The state sits with the surface,
 * so it outlives the controls the surface mounts and unmounts. The host only
 * tracks the pending state; the outcome stays the callback's.
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
