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
			const result = action.callback();
			if ( ! isThenable( result ) ) {
				return;
			}

			setActionPending( pendingActions, uuid, action.id, true );
			try {
				await result;
			} finally {
				setActionPending( pendingActions, uuid, action.id, false );
			}
		},
		[ pendingActions, uuid ]
	);

	return { run, pendingIds };
}
