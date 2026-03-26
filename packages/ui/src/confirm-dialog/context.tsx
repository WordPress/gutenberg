import { createContext } from '@wordpress/element';

import type { RootProps } from './types';

type Intent = NonNullable< RootProps[ 'intent' ] >;

interface ConfirmDialogContextValue {
	intent: Intent;
	title: string;
}

const ConfirmDialogContext = createContext< ConfirmDialogContextValue >( {
	intent: 'default',
	title: '',
} );

/**
 * Returns intent-dependent configuration for the confirm dialog.
 *
 * - `irreversible`: uses `alertdialog` role and blocks all implicit
 *   dismissals (backdrop click and Escape key).
 * - `default`: standard `dialog` role, only explicit close actions
 *   (cancel/confirm buttons) or Escape key can dismiss.
 */
function getIntentConfig( intent: Intent ) {
	const isIrreversible = intent === 'irreversible';

	return {
		popupRole: isIrreversible
			? ( 'alertdialog' as const )
			: ( 'dialog' as const ),
		shouldBlockDismiss( reason: string ) {
			return isIrreversible
				? reason !== 'close-press'
				: reason === 'outside-press';
		},
	};
}

export { ConfirmDialogContext, getIntentConfig };
