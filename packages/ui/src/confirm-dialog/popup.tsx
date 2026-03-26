import { forwardRef, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import * as Dialog from '../dialog';
import { ConfirmDialogContext, getIntentConfig } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const Popup = forwardRef< HTMLDivElement, PopupProps >(
	function ConfirmDialogPopup(
		{
			title,
			children,
			onConfirm,
			confirmButtonText = __( 'OK' ),
			cancelButtonText = __( 'Cancel' ),
			loading = false,
		},
		ref
	) {
		const { intent } = useContext( ConfirmDialogContext );
		const { popupRole } = getIntentConfig( intent );

		return (
			<Dialog.Popup ref={ ref } role={ popupRole }>
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
					<Dialog.Action
						className={
							intent === 'irreversible'
								? styles[ 'irreversible-action' ]
								: undefined
						}
						onClick={ onConfirm }
						loading={ loading }
					>
						{ confirmButtonText }
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		);
	}
);

export { Popup };
