import { forwardRef, useContext } from 'react';
import { __ } from '@wordpress/i18n';
import * as Dialog from '../dialog';
import { ConfirmDialogContext } from './context';
import { type PopupProps } from './types';
import styles from './style.module.css';

const Popup = forwardRef< HTMLDivElement, PopupProps >(
	function ConfirmDialogPopup(
		{
			children,
			onConfirm,
			confirmButtonText = __( 'OK', 'wpds' ),
			cancelButtonText = __( 'Cancel', 'wpds' ),
		},
		ref
	) {
		const { intent } = useContext( ConfirmDialogContext );
		const isIrreversible = intent === 'irreversible';

		return (
			<Dialog.Popup ref={ ref }>
				<Dialog.Header>
					<Dialog.Heading />
				</Dialog.Header>
				{ children }
				<Dialog.Footer>
					<Dialog.Action variant="minimal">
						{ cancelButtonText }
					</Dialog.Action>
					<Dialog.Action
						className={
							isIrreversible
								? styles[ 'irreversible-action' ]
								: undefined
						}
						onClick={ onConfirm }
					>
						{ confirmButtonText }
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		);
	}
);

export { Popup };
