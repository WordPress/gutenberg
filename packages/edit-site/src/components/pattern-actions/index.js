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
	item,
	className,
	toggleProps = {},
	popoverProps = {},
	onRemove,
	icon = moreVertical,
} ) {
	const record = useSelect(
		( select ) => {
			if ( item?.type && item?.id ) {
				return select( coreStore ).getEntityRecord(
					'postType',
					item?.type,
					item?.id
				);
			}
			return null;
		},
		[ item?.type, item?.id ]
	);
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { __experimentalDeleteReusableBlock } =
		useDispatch( reusableBlocksStore );
	// Only custom patterns or custom template parts can be renamed or deleted.
	const isUserPattern = record?.type === PATTERN_TYPES.user;
	const isNonUserPattern = item?.type === PATTERN_TYPES.theme;
	const isTemplate = record?.type === TEMPLATE_POST_TYPE;
	const isTemplatePart = record?.type === TEMPLATE_PART_POST_TYPE;

	// Type check to make sure we're dealing with a pattern or template.
	if (
		! isTemplatePart &&
		! isTemplate &&
		! isUserPattern &&
		! isNonUserPattern
	) {
		return null;
	}

	const isRemovable = isTemplateRemovable( record );
	const isRevertable = isTemplateRevertable( record );
	// Only patterns and template parts can be duplicated for now.
	const isDuplicable = isUserPattern || isNonUserPattern || isTemplatePart;

	// If the pattern is not editable or duplicable, don't show the menu.
	if ( ! isRemovable && ! isRevertable && ! isDuplicable ) {
		return null;
	}

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

	const deleteItem = async () => {
		if ( isTemplateRemovable( record ) ) {
			removeTemplate( record );
		} else if ( isUserPattern ) {
			deletePattern( record );
		}
	};

	async function revertAndSaveTemplate() {
		try {
			await revertTemplate( record, { allowUndo: false } );
			await saveEditedEntityRecord( 'postType', record.type, record.id );

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
				POST_TYPE_LABELS[ record?.type ] ??
					POST_TYPE_LABELS[ TEMPLATE_POST_TYPE ]
			);
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: fallbackErrorMessage;

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
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
						<RenameMenuItem
							postId={ record?.id }
							postType={ record?.type }
							onClose={ onClose }
						/>
					) }
					{ isDuplicable && (
						<DuplicateMenuItem
							categoryId={ categoryId }
							item={ record || item }
							onClose={ onClose }
							label={ __( 'Duplicate' ) }
						/>
					) }
					{ isUserPattern && (
						<MenuItem onClick={ () => exportAsJSON( record ) }>
							{ __( 'Export as JSON' ) }
						</MenuItem>
					) }
					{ isEditable && (
						<DeleteMenuItem
							postType={ record?.type }
							onRemove={ () => {
								deleteItem();
								onRemove?.( record );
								onClose();
							} }
							title={ decodedTitle }
						/>
					) }
					{ isRevertable && (
						<RevertMenuItem
							onRemove={ () => {
								revertAndSaveTemplate();
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
