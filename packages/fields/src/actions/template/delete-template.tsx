/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
// @ts-ignore
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { isTemplateRemovable, getItemTitle } from '../utils';
import type { Template, TemplatePart } from '../../types';
import { dispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

export const removeTemplates = async (
	items: ( Template | TemplatePart )[]
) => {
	const isResetting = items.every( ( item ) => item?.has_theme_file );

	const promiseResult: any[] = await Promise.allSettled(
		items.map( ( item ) =>
			dispatch( coreStore ).deleteEntityRecord(
				'postType',
				item.type,
				item.id,
				{ force: true },
				{ throwOnError: true }
			)
		)
	);

	// If all the promises were fulfilled with sucess.
	if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
		let successMessage;

		if ( items.length === 1 ) {
			let title = '';
			if ( typeof items[ 0 ].title === 'string' ) {
				title = items[ 0 ].title;
			} else if (
				'rendered' in items[ 0 ].title &&
				typeof items[ 0 ].title.rendered === 'string'
			) {
				title = items[ 0 ].title?.rendered;
			} else if (
				'raw' in items[ 0 ].title &&
				typeof items[ 0 ].title?.raw === 'string'
			) {
				title = items[ 0 ].title?.raw;
			}

			successMessage = isResetting
				? sprintf(
						/* translators: The template/part's name. */
						__( '"%s" reset.' ),
						decodeEntities( title )
				  )
				: sprintf(
						/* translators: The template/part's name. */
						__( '"%s" deleted.' ),
						decodeEntities( title )
				  );
		} else {
			successMessage = isResetting
				? __( 'Items reset.' )
				: __( 'Items deleted.' );
		}

		dispatch( noticesStore ).createSuccessNotice( successMessage, {
			type: 'snackbar',
			id: 'editor-template-deleted-success',
		} );
	} else {
		// If there was at lease one failure.
		let errorMessage;
		// If we were trying to delete a single template.
		if ( promiseResult.length === 1 ) {
			if ( promiseResult[ 0 ].reason?.message ) {
				errorMessage = promiseResult[ 0 ].reason.message;
			} else {
				errorMessage = isResetting
					? __( 'An error occurred while reverting the item.' )
					: __( 'An error occurred while deleting the item.' );
			}
			// If we were trying to delete a multiple templates
		} else {
			const errorMessages = new Set();
			const failedPromises = promiseResult.filter(
				( { status } ) => status === 'rejected'
			);
			for ( const failedPromise of failedPromises ) {
				if ( failedPromise.reason?.message ) {
					errorMessages.add( failedPromise.reason.message );
				}
			}
			if ( errorMessages.size === 0 ) {
				errorMessage = __(
					'An error occurred while deleting the items.'
				);
			} else if ( errorMessages.size === 1 ) {
				errorMessage = isResetting
					? sprintf(
							/* translators: %s: an error message */
							__(
								'An error occurred while reverting the items: %s'
							),
							[ ...errorMessages ][ 0 ]
					  )
					: sprintf(
							/* translators: %s: an error message */
							__(
								'An error occurred while deleting the items: %s'
							),
							[ ...errorMessages ][ 0 ]
					  );
			} else {
				errorMessage = isResetting
					? sprintf(
							/* translators: %s: a list of comma separated error messages */
							__(
								'Some errors occurred while reverting the items: %s'
							),
							[ ...errorMessages ].join( ',' )
					  )
					: sprintf(
							/* translators: %s: a list of comma separated error messages */
							__(
								'Some errors occurred while deleting the items: %s'
							),
							[ ...errorMessages ].join( ',' )
					  );
			}
		}
		dispatch( noticesStore ).createErrorNotice( errorMessage, {
			type: 'snackbar',
		} );
	}
};

// This action is used for templates, patterns and template parts.
// Every other post type uses the similar `trashPostAction` which
// moves the post to trash.
const deleteTemplateAction: Action< Template | TemplatePart > = {
	id: 'delete-post',
	label: __( 'Delete' ),
	isPrimary: true,
	icon: trash,
	isEligible( post ) {
		return isTemplateRemovable( post );
	},
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );

		return (
			<VStack spacing="5">
				<Text>
					{ items.length > 1
						? sprintf(
								// translators: %d: number of items to delete.
								_n(
									'Delete %d item?',
									'Delete %d items?',
									items.length
								),
								items.length
						  )
						: sprintf(
								// translators: %s: The template or template part's titles
								__( 'Delete "%s"?' ),
								getItemTitle( items[ 0 ] )
						  ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							await removeTemplates( items );
							onActionPerformed?.( items );
							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export default deleteTemplateAction;
