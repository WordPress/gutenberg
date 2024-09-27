/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
import { DataForm, isItemValid } from '@wordpress/dataviews';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action, RenderModalProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { CoreDataError, BasePost } from '../types';
import { orderField } from '../fields';

const fields = [ orderField ];
const formOrderAction = {
	fields: [ 'menu_order' ],
};

function ReorderModal( {
	items,
	closeModal,
	onActionPerformed,
}: RenderModalProps< BasePost > ) {
	const [ item, setItem ] = useState( items[ 0 ] );
	const orderInput = item.menu_order;
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onOrder( event: React.FormEvent ) {
		event.preventDefault();

		if ( ! isItemValid( item, fields, formOrderAction ) ) {
			return;
		}

		try {
			await editEntityRecord( 'postType', item.type, item.id, {
				menu_order: orderInput,
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
	const isSaveDisabled = ! isItemValid( item, fields, formOrderAction );
	return (
		<form onSubmit={ onOrder }>
			<VStack spacing="5">
				<div>
					{ __(
						'Determines the order of pages. Pages with the same order value are sorted alphabetically. Negative order values are supported.'
					) }
				</div>
				<DataForm
					data={ item }
					fields={ fields }
					form={ formOrderAction }
					onChange={ ( changes ) =>
						setItem( {
							...item,
							...changes,
						} )
					}
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
						disabled={ isSaveDisabled }
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
	RenderModal: ReorderModal,
};

export default reorderPage;
