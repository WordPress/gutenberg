/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function SaveConfirmationDialog( { onConfirm, onCancel } ) {
	return (
		<div className="blocks-save-confirmation">
			<p>{ __( 'You have edited a reusable block. These edits apply across all posts and pages that use this block.' ) }</p>

			<p>{ __( 'You can:' ) }</p>

			<p className="blocks-save-confirmation__buttons">
				<Button
					className="blocks-save-confirmation__button"
					isLarge
					onClick={ onConfirm }>
					{ __( 'Edit across all instances' ) }
				</Button>
				<Button
					className="blocks-save-confirmation__button"
					isLarge
					onClick={ onCancel }>
					{ __( 'Detatch from Reusable Block' ) }
				</Button>
			</p>
		</div>
	);
}

export default SaveConfirmationDialog;
