/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import RenameMenuItem from './rename-menu-item';

export default function TemplateActions( {
	postType,
	postId,
	className,
	toggleProps,
	onRemove,
} ) {
	const template = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'postType', postType, postId ),
		[ postType, postId ]
	);
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const isRemovable = isTemplateRemovable( template );
	const isRevertable = isTemplateRevertable( template );

	if ( ! isRemovable && ! isRevertable ) {
		return null;
	}

	async function revertAndSaveTemplate() {
		try {
			await revertTemplate( template, { allowUndo: false } );
			await saveEditedEntityRecord(
				'postType',
				template.type,
				template.id
			);

			createSuccessNotice(
				sprintf(
					/* translators: The template/part's name. */
					__( '"%s" reverted.' ),
					template.title.rendered
				),
				{
					type: 'snackbar',
					id: 'edit-site-template-reverted',
				}
			);
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
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className={ className }
			toggleProps={ toggleProps }
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
									onRemove?.();
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
