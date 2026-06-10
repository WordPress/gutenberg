/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import type { Action } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { PostTypeFormData } from '../types';
import type { CoreDataError } from '../../types';
import { useMaybeInvalidateContentTypeCache } from '../../utils/use-maybe-invalidate-content-type-cache';
import { POST_TYPE_ENTITY, TAXONOMY_ENTITY } from '../../constants';

function DeletePostTypeModal( {
	items,
	closeModal,
	onActionPerformed,
}: {
	items: PostTypeFormData[];
	closeModal?: () => void;
	onActionPerformed?: ( items: PostTypeFormData[] ) => void;
} ) {
	const [ isDeleting, setIsDeleting ] = useState( false );
	const { deleteEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const maybeInvalidateCache = useMaybeInvalidateContentTypeCache();

	async function onDelete() {
		if ( isDeleting ) {
			return;
		}
		setIsDeleting( true );
		const itemsToDelete = items.filter( ( item ) => item.id !== undefined );
		const promiseResult = await Promise.allSettled(
			itemsToDelete.map( ( item ) =>
				deleteEntityRecord(
					'postType',
					POST_TYPE_ENTITY,
					item.id as number,
					{ force: true },
					{ throwOnError: true }
				)
			)
		);
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			createSuccessNotice(
				itemsToDelete.length === 1
					? sprintf(
							/* translators: %s: The post type's plural label. */
							__( '"%s" post type deleted.' ),
							itemsToDelete[ 0 ].title.raw
					  )
					: sprintf(
							/* translators: %d: The number of post types. */
							_n(
								'%d post type deleted.',
								'%d post types deleted.',
								itemsToDelete.length
							),
							itemsToDelete.length
					  ),
				{ type: 'snackbar' }
			);
		} else {
			let errorMessage;
			if ( promiseResult.length === 1 ) {
				const typedError = promiseResult[ 0 ] as {
					reason?: CoreDataError;
				};
				if (
					typedError.reason?.message &&
					typedError.reason.code !== 'unknown_error'
				) {
					errorMessage = typedError.reason.message;
				} else {
					errorMessage = __( 'Failed to delete post type.' );
				}
			} else {
				const errorMessages = new Set< string >();
				const failedPromises = promiseResult.filter(
					( { status } ) => status === 'rejected'
				);
				for ( const failedPromise of failedPromises ) {
					const typedError = failedPromise as {
						reason?: CoreDataError;
					};
					if (
						typedError.reason?.message &&
						typedError.reason.code !== 'unknown_error'
					) {
						errorMessages.add( typedError.reason.message );
					}
				}
				if ( errorMessages.size === 0 ) {
					errorMessage = __( 'Failed to delete post types.' );
				} else if ( errorMessages.size === 1 ) {
					errorMessage = sprintf(
						/* translators: %s: an error message */
						__(
							'An error occurred while deleting the post type: %s'
						),
						[ ...errorMessages ][ 0 ]
					);
				} else {
					errorMessage = sprintf(
						/* translators: %s: a list of comma separated error messages */
						__(
							'Some errors occurred while deleting the post types: %s'
						),
						[ ...errorMessages ].join( ',' )
					);
				}
			}
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
		const deletedRefs = itemsToDelete
			.filter( ( _, i ) => promiseResult[ i ].status === 'fulfilled' )
			.flatMap( ( item ) => item.config.taxonomies );
		maybeInvalidateCache( deletedRefs, [], TAXONOMY_ENTITY );
		onActionPerformed?.( itemsToDelete );
		setIsDeleting( false );
		closeModal?.();
	}

	return (
		<Stack direction="column" gap="md">
			<Text>
				{ items.length > 1
					? sprintf(
							/* translators: %d: number of post types to delete. */
							_n(
								'Are you sure you want to delete %d post type?',
								'Are you sure you want to delete %d post types?',
								items.length
							),
							items.length
					  )
					: sprintf(
							/* translators: %s: The post type's plural label. */
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
					{ _x( 'Delete', 'verb' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

const deletePostTypeAction: Action< PostTypeFormData > = {
	id: 'delete-post-type',
	label: _x( 'Delete', 'verb' ),
	icon: trash,
	supportsBulk: true,
	hideModalHeader: true,
	modalFocusOnMount: 'firstContentElement',
	modalSize: 'small',
	RenderModal: DeletePostTypeModal,
};

export default deletePostTypeAction;
