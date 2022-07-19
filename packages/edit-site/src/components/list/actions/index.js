/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import isTemplateRemovable from '../../../utils/is-template-removable';
import isTemplateRevertable from '../../../utils/is-template-revertable';
import RenameMenuItem from './rename-menu-item';

export default function Actions( { template } ) {
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const isRemovable = isTemplateRemovable( template );
	const isRevertable = isTemplateRevertable( template );

	if ( ! isRemovable && ! isRevertable ) {
		return __( 'No actions' );
	}

	async function revertAndSaveTemplate() {
		try {
			await revertTemplate( template, { allowUndo: false } );
			await saveEditedEntityRecord(
				'postType',
				template.type,
				template.id
			);

			createSuccessNotice( __( 'Entity reverted.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while reverting the entity.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<DropdownMenu
			icon={ null }
			className="edit-site-list-table__actions"
			toggleProps={ {
				children: __( 'Actions' ),
				isSecondary: true,
			} }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ isRemovable && (
						<>
							<RenameMenuItem
								template={ template }
								onClose={ onClose }
							/>
							<MenuItem
								isDestructive
								isTertiary
								onClick={ () => {
									removeTemplate( template );
									onClose();
								} }
							>
								{ __( 'Delete' ) }
							</MenuItem>
						</>
					) }
					{ isRevertable && (
						<MenuItem
							info={ __(
								'Use the template as supplied by the theme.'
							) }
							onClick={ () => {
								revertAndSaveTemplate();
								onClose();
							} }
						>
							{ __( 'Clear customizations' ) }
						</MenuItem>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
