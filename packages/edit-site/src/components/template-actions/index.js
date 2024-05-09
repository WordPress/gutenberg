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

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import RenamePostMenuItem from '../rename-post-menu-item';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

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
	const { removeTemplate } = useDispatch( editSiteStore );
	const isRemovable = isTemplateRemovable( template );
	const isRevertable = isTemplateRevertable( template );

	if ( ! isRemovable && ! isRevertable ) {
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
					{ isRemovable && (
						<>
							<RenamePostMenuItem
								post={ template }
								onClose={ onClose }
							/>
							<DeleteMenuItem
								onRemove={ () => {
									removeTemplate( template );
									onRemove?.();
									onClose();
								} }
								title={ template.title.rendered }
							/>
						</>
					) }
					{ isRevertable && (
						<ResetMenuItem
							template={ template }
							onClose={ onClose }
						/>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}

function ResetMenuItem( { template, onClose } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
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
					__( '"%s" reset.' ),
					decodeEntities( template.title.rendered )
				),
				{
					type: 'snackbar',
					id: 'edit-site-template-reverted',
				}
			);
		} catch ( error ) {
			const fallbackErrorMessage =
				template.type === TEMPLATE_POST_TYPE
					? __( 'An error occurred while reverting the template.' )
					: __(
							'An error occurred while reverting the template part.'
					  );
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: fallbackErrorMessage;

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}
	return (
		<>
			<MenuItem onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Reset' ) }
			</MenuItem>
			<ConfirmDialog
				isOpen={ isModalOpen }
				onConfirm={ () => {
					revertAndSaveTemplate();
					onClose();
				} }
				onCancel={ () => setIsModalOpen( false ) }
				confirmButtonText={ __( 'Reset' ) }
			>
				{ __( 'Reset to default and clear all customizations?' ) }
			</ConfirmDialog>
		</>
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
