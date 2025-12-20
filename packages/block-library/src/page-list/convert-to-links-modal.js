/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

export const convertDescription = __(
	"This Navigation Menu displays your website's pages. Editing it will enable you to add, delete, or reorder pages. However, new pages will no longer be added automatically."
);

export function ConvertToLinksModal( { onClick, onClose, disabled } ) {
	return (
		<Modal
			onRequestClose={ onClose }
			title={ __( 'Edit Page List' ) }
			className="wp-block-page-list-modal"
			aria={ {
				describedby: useInstanceId(
					ConvertToLinksModal,
					'wp-block-page-list-modal__description'
				),
			} }
		>
			<p
				id={ useInstanceId(
					ConvertToLinksModal,
					'wp-block-page-list-modal__description'
				) }
			>
				{ convertDescription }
			</p>
			<div className="wp-block-page-list-modal-buttons">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onClose }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					accessibleWhenDisabled
					disabled={ disabled }
					onClick={ onClick }
				>
					{ __( 'Edit' ) }
				</Button>
			</div>
		</Modal>
	);
}
