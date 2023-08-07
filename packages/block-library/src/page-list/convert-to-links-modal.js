/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const convertDescription = __(
	'This page list is synced with the published pages on your site. Detach the page list to add, delete, or reorder pages yourself.'
);

export function ConvertToLinksModal( { onClick, onClose, disabled } ) {
	return (
		<Modal
			onRequestClose={ onClose }
			title={ __( 'Edit Page List' ) }
			className={ 'wp-block-page-list-modal' }
			aria={ {
				describedby: 'wp-block-page-list-modal__description',
			} }
		>
			<p id={ 'wp-block-page-list-modal__description' }>
				{ convertDescription }
			</p>
			<div className="wp-block-page-list-modal-buttons">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					variant="primary"
					disabled={ disabled }
					onClick={ onClick }
				>
					{ __( 'Detach' ) }
				</Button>
			</div>
		</Modal>
	);
}
