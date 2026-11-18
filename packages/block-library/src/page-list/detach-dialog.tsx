import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface DetachPageListDialogProps {
	/** Whether the pages are still loading. */
	isBusy?: boolean;
	/** What will happen, if not the Detach button's usual explanation. */
	message?: string;
	/** The dialog's title, if not "Detach Page List". */
	title?: string;
	/** The confirm button's label, if not "Detach". */
	confirmButtonText?: string;
	/** Called to go ahead. */
	onConfirm: () => void;
	/** Called to leave the Page List as it is. */
	onCancel: () => void;
}

/**
 * Asks before a Page List is turned into links, whether by its Detach button
 * or by adding or moving an item between its pages.
 *
 * @param props                   Component props.
 * @param props.isBusy            Whether the pages are still loading.
 * @param props.message           What will happen, if not the usual explanation.
 * @param props.title             The dialog's title, if not "Detach Page List".
 * @param props.confirmButtonText The confirm button's label, if not "Detach".
 * @param props.onConfirm         Called to go ahead.
 * @param props.onCancel          Called to leave the Page List as it is.
 */
export default function DetachPageListDialog( {
	isBusy = false,
	message,
	title,
	confirmButtonText,
	onConfirm,
	onCancel,
}: DetachPageListDialogProps ) {
	return (
		<ConfirmDialog
			isOpen
			title={ title ?? __( 'Detach Page List' ) }
			__experimentalHideHeader={ false }
			confirmButtonText={ confirmButtonText ?? __( 'Detach' ) }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			isBusy={ isBusy }
			size="medium"
		>
			{ message ??
				__(
					"This Navigation Menu displays your website's pages. Detaching will turn them into links that you can edit, and you can add other links, posts and items. New pages will still be added automatically."
				) }
		</ConfirmDialog>
	);
}
