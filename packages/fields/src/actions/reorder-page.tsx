/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { CoreDataError, BasePost } from '../types';

interface RenderModalProps< Item > {
	items: Item[];
	closeModal?: () => void;
	onActionPerformed?: ( items: Item[] ) => void;
}

interface Action< Item > {
	id: string;
	label: string;
	isEligible?: ( item: Item ) => boolean;
	modalFocusOnMount?: string;
	RenderModal: ( props: RenderModalProps< Item > ) => JSX.Element;
}

function isItemValid( item: BasePost ): boolean {
	return (
		typeof item.menu_order === 'number' &&
		Number.isInteger( item.menu_order ) &&
		item.menu_order > 0
	);
}

function ReorderModal( {
	items,
	closeModal,
	onActionPerformed,
}: RenderModalProps< BasePost > ) {
	const [ item, setItem ] = useState( items[ 0 ] );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const isValid = isItemValid( item );

	async function onOrder( event: React.FormEvent ) {
		event.preventDefault();

		if ( ! isValid ) {
			return;
		}

		try {
			await editEntityRecord( 'postType', item.type, item.id, {
				menu_order: item.menu_order,
			} );
			closeModal?.();
			// Persist edited entity.
			await saveEditedEntityRecord( 'postType', item.type, item.id, {
				throwOnError: true,
			} );
			createSuccessNotice( __( 'Order updated.' ), {
				type: 'snackbar',
			} );
			onActionPerformed?.( items );
		} catch ( error ) {
			const typedError = error as CoreDataError;
			const errorMessage =
				typedError.message && typedError.code !== 'unknown_error'
					? typedError.message
					: __( 'An error occurred while updating the order' );
			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	}

	return (
		<form onSubmit={ onOrder }>
			<VStack spacing="5">
				<div>
					{ __(
						'Determines the order of pages. Pages with the same order value are sorted alphabetically. Negative order values are supported.'
					) }
				</div>
				<InputControl
					__next40pxDefaultSize
					label={ __( 'Order' ) }
					type="number"
					value={
						typeof item.menu_order === 'number' &&
						Number.isInteger( item.menu_order )
							? String( item.menu_order )
							: ''
					}
					onChange={ ( value ) => {
						const parsed = parseInt( value as string, 10 ); // absorbs '' and undefined
						setItem( {
							...item,
							menu_order: isNaN( parsed ) ? undefined : parsed,
						} );
					} }
				/>
				<HStack justify="right">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => {
							closeModal?.();
						} }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						accessibleWhenDisabled
						disabled={ ! isValid }
					>
						{ __( 'Save' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}

const reorderPage: Action< BasePost > = {
	id: 'order-pages',
	label: __( 'Order' ),
	isEligible( { status } ) {
		return status !== 'trash';
	},
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ReorderModal,
};

/**
 * Reorder action for BasePost.
 */
export default reorderPage;
