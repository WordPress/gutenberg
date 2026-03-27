import { useMemo } from '@wordpress/element';
import * as Dialog from '../dialog';
import { ConfirmDialogContext } from './context';
import type { RootProps } from './types';

/**
 * A convenience wrapper for Dialog that provides common confirmation dialog
 * patterns with confirm and cancel actions.
 *
 * Use `ConfirmDialog.Trigger` to render a button that opens the dialog.
 * Use `ConfirmDialog.Popup` to render the dialog content.
 * The `ConfirmDialog.Trigger` is optional — the dialog can also be controlled
 * via `open` / `onOpenChange` props.
 *
 * ## Use cases
 *
 * - **Default intent**: Standard confirmation dialog for reversible actions.
 *   The dialog can be dismissed via Escape key, backdrop click, or the
 *   cancel/confirm buttons.
 * - **Irreversible intent**: Confirmation dialog for irreversible actions that
 *   cannot be undone. Backdrop click is blocked; Escape key, cancel button,
 *   and confirm button still dismiss the dialog. The popup uses
 *   `role="alertdialog"` and the confirm button uses error/danger coloring.
 *
 * For use cases outside the standard confirm/cancel pattern, use the lower-level
 * `Dialog` component directly.
 *
 * See the [Destructive Actions guidelines](?path=/docs/design-system-patterns-destructive-actions--docs)
 * for more details on when to use each pattern.
 */
function Root( {
	intent = 'default',
	children,
	open,
	onOpenChange,
	defaultOpen,
}: RootProps ) {
	const contextValue = useMemo( () => ( { intent } ), [ intent ] );

	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ onOpenChange }
			defaultOpen={ defaultOpen }
			disablePointerDismissal={ intent === 'irreversible' }
		>
			<ConfirmDialogContext.Provider value={ contextValue }>
				{ children }
			</ConfirmDialogContext.Provider>
		</Dialog.Root>
	);
}

export { Root };
