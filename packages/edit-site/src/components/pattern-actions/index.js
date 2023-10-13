/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import RenameMenuItem from './rename-menu-item';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	POST_TYPE_LABELS,
	PATTERN_TYPES,
} from '../../utils/constants';

export default function PatternActions( {
	postType,
	postId,
	className,
	toggleProps,
	onRemove,
} ) {
	const record = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'postType', postType, postId ),
		[ postType, postId ]
	);
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { __experimentalDeleteReusableBlock } =
		useDispatch( reusableBlocksStore );
	const isRemovable = isTemplateRemovable( record );
	// Only custom patterns or custom template parts can be renamed or deleted.
	const isUserPattern = record?.type === PATTERN_TYPES.user;
	const isTemplate = record?.type === TEMPLATE_POST_TYPE;
	const isTemplatePart = record?.type === TEMPLATE_PART_POST_TYPE;

	if (
		! isRemovable &&
		! isTemplatePart &&
		! isTemplate &&
		! isUserPattern
	) {
		return null;
	}

	const isEditable = isUserPattern || isRemovable;
	const decodedTitle = decodeEntities(
		record?.title?.rendered || record?.title?.raw
	);

	const deletePattern = async ( pattern ) => {
		try {
			await __experimentalDeleteReusableBlock( pattern.id );
			createSuccessNotice(
				sprintf(
					// translators: %s: The pattern's title e.g. 'Call to action'.
					__( '"%s" deleted.' ),
					decodedTitle
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while deleting the pattern.' );
			createErrorNotice( errorMessage, {
				type: 'snackbar',
				id: 'edit-site-patterns-error',
			} );
		}
	};

	const deleteItem = async ( item ) => {
		if ( isTemplateRemovable( item ) ) {
			removeTemplate( item );
		} else if ( isUserPattern ) {
			deletePattern( item );
		}
	};

	async function revertAndSaveTemplate( item ) {
		try {
			await revertTemplate( record, { allowUndo: false } );
			await saveEditedEntityRecord( 'postType', item.type, item.id );

			createSuccessNotice(
				sprintf(
					/* translators: The template/part's name. */
					__( '"%s" reverted.' ),
					decodedTitle
				),
				{
					type: 'snackbar',
					id: 'edit-site-template-reverted',
				}
			);
		} catch ( error ) {
			const fallbackErrorMessage = sprintf(
				// translators: %s is a post type label, e.g., Template, Template Part or Pattern.
				__( 'An error occurred while reverting the %s.' ),
				POST_TYPE_LABELS[ postType ] ??
					POST_TYPE_LABELS[ TEMPLATE_POST_TYPE ]
			);
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: fallbackErrorMessage;

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	const shouldDisplayMenu = isEditable || isTemplateRevertable( record );

	if ( ! shouldDisplayMenu ) {
		return null;
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
					{ isEditable && (
						<>
							<RenameMenuItem
								postId={ postId }
								postType={ postType }
								onClose={ onClose }
							/>
							<DeleteMenuItem
								isDestructive={ true }
								onRemove={ () => {
									deleteItem( record );
									onRemove?.();
									onClose();
								} }
								title={ decodedTitle }
							/>
						</>
					) }

					{ isTemplateRevertable( record ) && (
						<MenuItem
							info={ __(
								'Use the template as supplied by the theme.'
							) }
							onClick={ () => {
								revertAndSaveTemplate( record );
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

function DeleteMenuItem( { onRemove, title } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	return (
		<>
			<MenuItem isDestructive onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Delete' ) }
			</MenuItem>
			<ConfirmDialog
				isOpen={ isModalOpen }
				onConfirm={ onRemove }
				onCancel={ () => setIsModalOpen( false ) }
				confirmButtonText={ __( 'Delete' ) }
			>
				{ sprintf(
					// translators: %s: The template or template part's title.
					__( 'Are you sure you want to delete "%s"?' ),
					decodeEntities( title )
				) }
			</ConfirmDialog>
		</>
	);
}
