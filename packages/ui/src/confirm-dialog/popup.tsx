import { forwardRef, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import * as Dialog from '../dialog';
import { ConfirmDialogContext, getIntentConfig } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const Popup = forwardRef< HTMLDivElement, PopupProps >(
	function ConfirmDialogPopup(
		{
			children,
			onConfirm,
			confirmButtonText = __( 'OK' ),
			cancelButtonText = __( 'Cancel' ),
			loading = false,
		},
		ref
	) {
		const { intent, title } = useContext( ConfirmDialogContext );
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
						// `disabled` must be set explicitly alongside `loading`
						// because Dialog.Action wraps Base UI's Dialog.Close,
						// which defaults `disabled` to `false` internally —
						// overriding the `aria-disabled` that Button would
						// normally derive from the `loading` prop.
						disabled={ loading || undefined }
					>
						{ confirmButtonText }
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		);
	}
);

export { Popup };
