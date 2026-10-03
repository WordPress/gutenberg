import { useCallback } from '@wordpress/element';
import { useObservableValue } from '@wordpress/compose';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { setActionPending } from '../../utils/pending-actions-map';

const NONE: ReadonlySet< string > = new Set();

function isThenable( value: unknown ): value is PromiseLike< unknown > {
	return (
		typeof ( value as PromiseLike< unknown > | null )?.then === 'function'
	);
}

/**
 * Logs a callback failure with the instance and the action it belongs to.
 * The rejection is passed through so a plain object stays inspectable.
 *
 * Hosts have no notices capability yet, so this is the only surface.
 *
 * @param {string}  uuid     The instance.
 * @param {string}  actionId The action.
 * @param {unknown} error    Whatever the callback threw or rejected with.
 */
function logActionFailure(
	uuid: string,
	actionId: string,
	error: unknown
): void {
	// eslint-disable-next-line no-console -- Deliberately log errors here.
	console.error( `Widget ${ uuid } action "${ actionId }" failed.`, error );
}

/**
 * Runs an instance's callback actions and tracks, by `id`, the ones whose
 * promise has not settled. The state lives with the instance, so it
 * survives the surface that ran the action unmounting.
 *
 * @param {string} uuid The instance.
 */
export function useRunActions( uuid: string ): {
	run: ( action: WidgetCallbackAction ) => Promise< void >;
	pendingIds: ReadonlySet< string >;
} {
	const { pendingActions } = useDashboardInternalContext();
	const pendingIds = useObservableValue( pendingActions, uuid ) ?? NONE;

	const run = useCallback(
		async ( action: WidgetCallbackAction ) => {
			let result: void | Promise< void >;
			try {
				result = action.callback();
			} catch ( error ) {
				logActionFailure( uuid, action.id, error );
				return;
			}

			if ( ! isThenable( result ) ) {
				return;
			}

			setActionPending( pendingActions, uuid, action.id, true );
			try {
				await result;
			} catch ( error ) {
				logActionFailure( uuid, action.id, error );
			} finally {
				setActionPending( pendingActions, uuid, action.id, false );
			}
		},
		[ pendingActions, uuid ]
	);

	return { run, pendingIds };
}
