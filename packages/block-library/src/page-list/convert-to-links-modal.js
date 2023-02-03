/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export const convertDescription = __(
	'This menu is automatically kept in sync with pages on your site. You can manage the menu yourself by clicking "Edit" below.'
);

export function ConvertToLinksModal( { onClick, disabled } ) {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	return (
		<>
			<BlockControls group="other">
				<ToolbarButton title={ __( 'Edit' ) } onClick={ openModal }>
					{ __( 'Edit' ) }
				</ToolbarButton>
			</BlockControls>
			{ isOpen && (
				<Modal
					onRequestClose={ closeModal }
					title={ __( 'Edit this menu' ) }
					className={ 'wp-block-page-list-modal' }
					aria={ {
						describedby: 'wp-block-page-list-modal__description',
					} }
				>
					<p id={ 'wp-block-page-list-modal__description' }>
						{ convertDescription }
					</p>
					<div className="wp-block-page-list-modal-buttons">
						<Button variant="tertiary" onClick={ closeModal }>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							disabled={ disabled }
							onClick={ onClick }
						>
							{ __( 'Edit' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
}
