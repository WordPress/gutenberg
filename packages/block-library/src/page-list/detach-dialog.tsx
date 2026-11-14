import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface DetachPageListDialogProps {
	/** Whether the pages are still loading. */
	isBusy?: boolean;
	/** What will happen, if not the Detach button's usual explanation. */
	message?: string;
	/** Called to go ahead. */
	onConfirm: () => void;
	/** Called to leave the Page List as it is. */
	onCancel: () => void;
}

/**
 * Asks before a Page List is turned into links, whether by its Detach button
 * or by adding or moving an item between its pages.
 *
 * @param props           Component props.
 * @param props.isBusy    Whether the pages are still loading.
 * @param props.message   What will happen, if not the usual explanation.
 * @param props.onConfirm Called to go ahead.
 * @param props.onCancel  Called to leave the Page List as it is.
 */
export default function DetachPageListDialog( {
	isBusy = false,
	message,
	onConfirm,
	onCancel,
}: DetachPageListDialogProps ) {
	return (
		<ConfirmDialog
			isOpen
			title={ __( 'Detach Page List' ) }
			__experimentalHideHeader={ false }
			confirmButtonText={ __( 'Detach' ) }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			isBusy={ isBusy }
			size="medium"
		>
			{ message ??
				__(
					"This Navigation Menu displays your website's pages. Detaching will enable you to add, delete, or reorder pages. However, new pages will no longer be added automatically."
				) }
		</ConfirmDialog>
	);
}
