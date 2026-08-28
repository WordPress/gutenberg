import { useCallback, useState } from '@wordpress/element';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';

/**
 * Runs a callback action, pending while a returned promise settles. The
 * host only tracks the pending state; the outcome stays the callback's.
 *
 * @param {WidgetCallbackAction} action The action to run.
 */
export function useRunAction( action: WidgetCallbackAction ): {
	run: () => Promise< void >;
	isPending: boolean;
} {
	const [ isPending, setIsPending ] = useState( false );

	const run = useCallback( async () => {
		setIsPending( true );
		try {
			await action.callback();
		} finally {
			setIsPending( false );
		}
	}, [ action ] );

	return { run, isPending };
}
