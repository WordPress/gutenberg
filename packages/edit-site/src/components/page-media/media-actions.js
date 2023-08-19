/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

function DeleteMenuItem( { onRemove } ) {
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
				{ __( 'Are you sure you want to delete this attachment?' ) }
			</ConfirmDialog>
		</>
	);
}

export default function MediaActions( { attachmentId, onRemove, ...props } ) {
	const isRemovable = useSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord(
				'root',
				'media',
				attachmentId
			),
		[ attachmentId ]
	);
	const { deleteEntityRecord } = useDispatch( coreStore );

	if ( ! isRemovable ) {
		return null;
	}

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			{ ...props }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ isRemovable && (
						<>
							<DeleteMenuItem
								onRemove={ () => {
									deleteEntityRecord(
										'root',
										'media',
										attachmentId,
										{ force: true }
									);
									onRemove?.();
									onClose();
								} }
							/>
						</>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
