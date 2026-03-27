import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { useMemo } from '@wordpress/element';
import { AlertDialogContext } from './context';
import type { RootProps } from './types';

/**
 * A dialog that requires a user response to proceed.
 *
 * Use `AlertDialog.Trigger` to render a button that opens the dialog.
 * Use `AlertDialog.Popup` to render the dialog content.
 * The `AlertDialog.Trigger` is optional — the dialog can also be controlled
 * via `open` / `onOpenChange` props.
 *
 * ## Use cases
 *
 * - **Default intent**: Standard confirmation dialog for reversible actions.
 * - **Irreversible intent**: Confirmation dialog for irreversible actions that
 *   cannot be undone. The confirm button uses error/danger coloring.
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
		<_AlertDialog.Root
			open={ open }
			onOpenChange={ onOpenChange }
			defaultOpen={ defaultOpen }
		>
			<AlertDialogContext.Provider value={ contextValue }>
				{ children }
			</AlertDialogContext.Provider>
		</_AlertDialog.Root>
	);
}

export { Root };
