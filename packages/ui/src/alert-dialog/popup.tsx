import { forwardRef, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '../button';
import * as Dialog from '../dialog';
import { AlertDialogContext } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const Popup = forwardRef< HTMLDivElement, PopupProps >(
	function AlertDialogPopup(
		{
			title,
			children,
			onConfirm,
			confirmButtonText = __( 'OK' ),
			cancelButtonText = __( 'Cancel' ),
			loading,
		},
		ref
	) {
		const { intent } = useContext( AlertDialogContext );

		// When `loading` is provided, the consumer controls when the dialog
		// closes (async flow). Use a plain Button so clicking confirm doesn't
		// auto-close — the consumer sets `open={false}` after their operation.
		const ConfirmButton = loading !== undefined ? Button : Dialog.Action;

		return (
			<Dialog.Popup ref={ ref }>
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
				</Dialog.Header>
				{ children }
				<Dialog.Footer>
					<Dialog.Action
						variant="minimal"
						disabled={ loading || undefined }
					>
						{ cancelButtonText }
					</Dialog.Action>
					<ConfirmButton
						className={
							intent === 'irreversible'
								? styles[ 'irreversible-action' ]
								: undefined
						}
						onClick={ onConfirm }
						loading={ loading }
					>
						{ confirmButtonText }
					</ConfirmButton>
				</Dialog.Footer>
			</Dialog.Popup>
		);
	}
);

export { Popup };
