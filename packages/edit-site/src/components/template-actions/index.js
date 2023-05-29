/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
// import { Icon, moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import RenameMenuItem from './rename-menu-item';

import { unlock } from '../../private-apis';

const {
	DropdownMenuV2,
	// DropdownMenuCheckboxItemV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	// DropdownMenuLabelV2,
	// DropdownMenuRadioGroupV2,
	// DropdownMenuRadioItemV2,
	// DropdownMenuSeparatorV2,
	// DropdownSubMenuV2,
	// DropdownSubMenuTriggerV2,
} = unlock( componentsPrivateApis );

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
		<DropdownMenuV2
			label={ __( 'Actions' ) }
			className={ className }
			toggleProps={ toggleProps }
			// trigger={ <Icon icon={ moreVertical } /> }
			trigger={ <button>hi</button> }
		>
			<DropdownMenuGroupV2>
				{ isRemovable && (
					<>
						<RenameMenuItem
							template={ template }
							as={ DropdownMenuItemV2 }
						/>
						<DropdownMenuItemV2
							onClick={ () => {
								removeTemplate( template );
								onRemove?.();
							} }
						>
							{ __( 'Delete' ) }
						</DropdownMenuItemV2>
					</>
				) }
				{ isRevertable && (
					<DropdownMenuItemV2
						info={ __(
							'Use the template as supplied by the theme.'
						) }
						onClick={ () => {
							revertAndSaveTemplate();
							// onClose();
						} }
					>
						{ __( 'Clear customizations' ) }
					</DropdownMenuItemV2>
				) }
			</DropdownMenuGroupV2>
		</DropdownMenuV2>
	);
}
