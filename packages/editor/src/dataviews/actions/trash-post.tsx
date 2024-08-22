/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getItemTitle, isTemplateOrTemplatePart } from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

const trashPost: Action< PostWithPermissions > = {
	id: 'move-to-trash',
	label: __( 'Move to trash' ),
	isPrimary: true,
	icon: trash,
	isEligible( item ) {
		if ( isTemplateOrTemplatePart( item ) || item.type === 'wp_block' ) {
			return false;
		}

		return (
			!! item.status &&
			! [ 'auto-draft', 'trash' ].includes( item.status ) &&
			item.permissions?.delete
		);
	},
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const { deleteEntityRecord } = useDispatch( coreStore );
		return (
			<VStack spacing="5">
				<Text>
					{ items.length === 1
						? sprintf(
								// translators: %s: The item's title.
								__(
									'Are you sure you want to move "%s" to the trash?'
								),
								getItemTitle( items[ 0 ] )
						  )
						: sprintf(
								// translators: %d: The number of items (2 or more).
								_n(
									'Are you sure you want to move %d item to the trash ?',
									'Are you sure you want to move %d items to the trash ?',
									items.length
								),
								items.length
						  ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							const promiseResult = await Promise.allSettled(
								items.map( ( item ) =>
									deleteEntityRecord(
										'postType',
										item.type,
										item.id.toString(),
										{},
										{ throwOnError: true }
									)
								)
							);
							// If all the promises were fulfilled with success.
							if (
								promiseResult.every(
									( { status } ) => status === 'fulfilled'
								)
							) {
								let successMessage;
								if ( promiseResult.length === 1 ) {
									successMessage = sprintf(
										/* translators: The item's title. */
										__( '"%s" moved to the trash.' ),
										getItemTitle( items[ 0 ] )
									);
								} else {
									successMessage = sprintf(
										/* translators: The number of items. */
										_n(
											'%s item moved to the trash.',
											'%s items moved to the trash.',
											items.length
										),
										items.length
									);
								}
								createSuccessNotice( successMessage, {
									type: 'snackbar',
									id: 'move-to-trash-action',
								} );
							} else {
								// If there was at least one failure.
								let errorMessage;
								// If we were trying to delete a single item.
								if ( promiseResult.length === 1 ) {
									const typedError = promiseResult[ 0 ] as {
										reason?: CoreDataError;
									};
									if ( typedError.reason?.message ) {
										errorMessage =
											typedError.reason.message;
									} else {
										errorMessage = __(
											'An error occurred while moving the item to the trash.'
										);
									}
									// If we were trying to delete multiple items.
								} else {
									const errorMessages = new Set();
									const failedPromises = promiseResult.filter(
										( { status } ) => status === 'rejected'
									);
									for ( const failedPromise of failedPromises ) {
										const typedError = failedPromise as {
											reason?: CoreDataError;
										};
										if ( typedError.reason?.message ) {
											errorMessages.add(
												typedError.reason.message
											);
										}
									}
									if ( errorMessages.size === 0 ) {
										errorMessage = __(
											'An error occurred while moving the items to the trash.'
										);
									} else if ( errorMessages.size === 1 ) {
										errorMessage = sprintf(
											/* translators: %s: an error message */
											__(
												'An error occurred while moving the item to the trash: %s'
											),
											[ ...errorMessages ][ 0 ]
										);
									} else {
										errorMessage = sprintf(
											/* translators: %s: a list of comma separated error messages */
											__(
												'Some errors occurred while moving the items to the trash: %s'
											),
											[ ...errorMessages ].join( ',' )
										);
									}
								}
								createErrorNotice( errorMessage, {
									type: 'snackbar',
								} );
							}
							if ( onActionPerformed ) {
								onActionPerformed( items );
							}
							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ _x( 'Trash', 'verb' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export default trashPost;
