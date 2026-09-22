import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { DialogModalProvider } from './context';
import type { RootProps } from './types';

/**
 * An ARIA-compliant dialog that opens on top of the entire page.
 *
 * Every dialog must include a `Dialog.Title` component for accessibility — it
 * serves as both the visible heading and the accessible label for the dialog.
 *
 * Always include a visible close button, either `Dialog.CloseIcon` or a clear
 * dismissing action button. If your dialog has a "Cancel" button in the footer,
 * the close icon may be redundant and create confusion about what clicking "X"
 * means.
 *
 * Use `Dialog.CloseIcon` for informational dialogs where dismissing is safe and
 * expected. For dialogs requiring explicit user choice (especially destructive
 * actions), omit the close icon and rely on footer action buttons like "Cancel"
 * and "Confirm" instead.
 */
function Root( { modal = true, children, ...props }: RootProps ) {
	return (
		<_Dialog.Root modal={ modal } { ...props }>
			<DialogModalProvider modal={ modal }>
				{ children }
			</DialogModalProvider>
		</_Dialog.Root>
	);
}

export { Root };
