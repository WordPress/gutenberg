import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { store as coreStore, useEntityId } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function NavigationMenuDeleteControl( { onDelete } ) {
	const [ isConfirmDialogVisible, setIsConfirmDialogVisible ] =
		useState( false );
	const id = useEntityId( 'postType', 'wp_navigation' );
	const { deleteEntityRecord } = useDispatch( coreStore );
	const containerRef = useRef();

	const handleDelete = () => {
		if ( containerRef.current ) {
			containerRef.current.tabIndex = -1;
			containerRef.current.focus();
		}

		deleteEntityRecord( 'postType', 'wp_navigation', id, {
			force: true,
		} );
		onDelete();
	};

	return (
		<div ref={ containerRef }>
			<Button
				__next40pxDefaultSize
				className="wp-block-navigation-delete-menu-button"
				variant="secondary"
				isDestructive
				onClick={ () => {
					setIsConfirmDialogVisible( true );
				} }
			>
				{ __( 'Delete menu' ) }
			</Button>
			{ isConfirmDialogVisible && (
				<ConfirmDialog
					isOpen
					onConfirm={ handleDelete }
					onCancel={ () => {
						setIsConfirmDialogVisible( false );
					} }
					confirmButtonText={ __( 'Delete' ) }
					size="medium"
				>
					{ __(
						'Are you sure you want to delete this Navigation Menu?'
					) }
				</ConfirmDialog>
			) }
		</div>
	);
}
