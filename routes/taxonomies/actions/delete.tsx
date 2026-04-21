/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import type { Action } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { TaxonomyFormData } from '../utils';

function DeleteTaxonomyModal( {
	items,
	closeModal,
	onActionPerformed,
}: {
	items: TaxonomyFormData[];
	closeModal?: () => void;
	onActionPerformed?: ( items: TaxonomyFormData[] ) => void;
} ) {
	const [ isDeleting, setIsDeleting ] = useState( false );
	const { deleteEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onDelete() {
		if ( isDeleting ) {
			return;
		}
		setIsDeleting( true );
		try {
			for ( const item of items ) {
				if ( item.id === undefined ) {
					continue;
				}
				await deleteEntityRecord(
					'postType',
					'wp_user_taxonomy',
					item.id,
					{ force: true },
					{ throwOnError: true }
				);
			}
			createSuccessNotice(
				items.length === 1
					? sprintf(
							/* translators: %s: taxonomy plural label. */
							__( '"%s" taxonomy deleted.' ),
							items[ 0 ].title.raw
					  )
					: __( 'Taxonomies deleted.' ),
				{ type: 'snackbar' }
			);
			onActionPerformed?.( items );
			closeModal?.();
		} catch ( error: any ) {
			createErrorNotice(
				error?.message && error?.code !== 'unknown_error'
					? error.message
					: __( 'Failed to delete taxonomy.' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsDeleting( false );
		}
	}

	return (
		<Stack direction="column" gap="md">
			<Text>
				{ items.length > 1
					? sprintf(
							/* translators: %d: number of taxonomies to delete. */
							_n(
								'Are you sure you want to delete %d taxonomy?',
								'Are you sure you want to delete %d taxonomies?',
								items.length
							),
							items.length
					  )
					: sprintf(
							/* translators: %s: taxonomy plural label. */
							__( 'Are you sure you want to delete "%s"?' ),
							items[ 0 ].title.raw
					  ) }
			</Text>
			<Stack direction="row" justify="flex-end" gap="sm">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ closeModal }
					disabled={ isDeleting }
					accessibleWhenDisabled
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					isDestructive
					isBusy={ isDeleting }
					disabled={ isDeleting }
					accessibleWhenDisabled
					onClick={ onDelete }
				>
					{ __( 'Delete' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

const deleteTaxonomyAction: Action< TaxonomyFormData > = {
	id: 'delete-taxonomy',
	label: __( 'Delete' ),
	icon: trash,
	supportsBulk: true,
	modalHeader: ( items ) =>
		items.length > 1 ? __( 'Delete taxonomies' ) : __( 'Delete taxonomy' ),
	modalSize: 'small',
	RenderModal: DeleteTaxonomyModal,
};

export default deleteTaxonomyAction;
