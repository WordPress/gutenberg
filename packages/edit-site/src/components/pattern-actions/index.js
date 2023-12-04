/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

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
import { downloadBlob } from '@wordpress/blob';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import RenameMenuItem from './rename-menu-item';
import DuplicateMenuItem from './duplicate-menu-item';
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
	toggleProps = {},
	popoverProps = {},
	onRemove,
	icon = moreVertical,
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
	// Only custom patterns or custom template parts can be renamed or deleted.
	const isUserPattern = record?.type === PATTERN_TYPES.user;
	const isTemplate = record?.type === TEMPLATE_POST_TYPE;
	const isTemplatePart = record?.type === TEMPLATE_PART_POST_TYPE;

	if ( ! isTemplatePart && ! isTemplate && ! isUserPattern ) {
		return null;
	}

	const isRemovable = isTemplateRemovable( record );
	const isRevertable = isTemplateRevertable( record );
	const isEditable = isUserPattern || isRemovable;
	const decodedTitle = decodeEntities(
		record?.title?.rendered || record?.title?.raw
	);

	const exportAsJSON = ( pattern ) => {
		const json = {
			__file: pattern.type,
			title: pattern?.title?.raw || pattern.slug,
			content: pattern.content.raw,
			syncStatus: pattern.wp_pattern_sync_status,
		};

		return downloadBlob(
			`${ kebabCase( json.title ) }.json`,
			JSON.stringify( json, null, 2 ),
			'application/json'
		);
	};

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
					// translators: %s: the pattern, template/part's title.
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
				// translators: %s: a post type label, e.g., Template, Template Part or Pattern.
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

	const shouldDisplayMenu = isEditable || isRevertable;

	if ( ! shouldDisplayMenu ) {
		return null;
	}

	const { categoryId } = getQueryArgs( window.location.href );

	return (
		<DropdownMenu
			icon={ icon }
			label={ __( 'Actions' ) }
			className={ className }
			popoverProps={ { placement: 'bottom-end', ...popoverProps } }
			toggleProps={ {
				describedBy: sprintf(
					// translators: %s: the pattern, template/part's title.
					__( 'Action menu for "%s"' ),
					decodedTitle
				),
				...toggleProps,
			} }
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
							{ isUserPattern && (
								<>
									<DuplicateMenuItem
										categoryId={ categoryId }
										item={ record }
										onClose={ onClose }
										label={ __( 'Duplicate' ) }
									/>
									<MenuItem
										onClick={ () => exportAsJSON( record ) }
									>
										{ __( 'Export as JSON' ) }
									</MenuItem>
								</>
							) }
							<DeleteMenuItem
								postType={ postType }
								onRemove={ () => {
									deleteItem( record );
									onRemove?.( record );
									onClose();
								} }
								title={ decodedTitle }
							/>
						</>
					) }

					{ isRevertable && (
						<RevertMenuItem
							onRemove={ () => {
								revertAndSaveTemplate( record );
								onClose();
							} }
						/>
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
			<MenuItem
				isDestructive={ true }
				onClick={ () => setIsModalOpen( true ) }
			>
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

function RevertMenuItem( { onRemove } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	return (
		<>
			<MenuItem
				info={ __( 'Use the template as supplied by the theme.' ) }
				onClick={ () => setIsModalOpen( true ) }
			>
				{ __( 'Clear customizations' ) }
			</MenuItem>
			<ConfirmDialog
				info={ __( 'Use the template as supplied by the theme.' ) }
				isOpen={ isModalOpen }
				onConfirm={ onRemove }
				onCancel={ () => setIsModalOpen( false ) }
				confirmButtonText={ __( 'Clear' ) }
			>
				{ __( 'Are you sure you want to clear these customizations?' ) }
			</ConfirmDialog>
		</>
	);
}
