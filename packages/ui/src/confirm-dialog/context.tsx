import { createContext } from '@wordpress/element';

import type { RootProps } from './types';

type Intent = NonNullable< RootProps[ 'intent' ] >;

interface ConfirmDialogContextValue {
	intent: Intent;
}

const ConfirmDialogContext = createContext< ConfirmDialogContextValue >( {
	intent: 'default',
} );

/**
 * Returns intent-dependent configuration for the confirm dialog.
 *
 * - `irreversible`: uses `alertdialog` role and blocks all implicit
 *   dismissals (backdrop click and Escape key).
 * - `default`: standard `dialog` role, dismissible via Escape key,
 *   backdrop click, or the cancel/confirm buttons.
 */
function getIntentConfig( intent: Intent ) {
	const isIrreversible = intent === 'irreversible';

	return {
		popupRole: isIrreversible
			? ( 'alertdialog' as const )
			: ( 'dialog' as const ),
		shouldBlockDismiss( reason: string ) {
			return isIrreversible && reason !== 'close-press';
		},
	};
}

export { ConfirmDialogContext, getIntentConfig };
