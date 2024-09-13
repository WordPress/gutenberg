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
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { isTemplateRemovable, getItemTitle } from '../utils';
import type { Template, TemplatePart } from '../../types';
import { decodeEntities } from '@wordpress/html-entities';
import type { Notice } from '../../mutation';
import { deleteWithNotices } from '../../mutation';

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

		const isResetting = items.every( ( item ) => item?.has_theme_file );

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
							const notice: Notice< Template | TemplatePart > = {
								onSuccess: {
									messages: {
										getOneItemMessage: ( item ) => {
											return isResetting
												? sprintf(
														/* translators: The template/part's name. */
														__( '"%s" reset.' ),
														decodeEntities(
															getItemTitle( item )
														)
												  )
												: sprintf(
														/* translators: The template/part's name. */
														__( '"%s" deleted.' ),
														decodeEntities(
															getItemTitle( item )
														)
												  );
										},
										getMultipleItemMessage: () => {
											return isResetting
												? __( 'Items reset.' )
												: __( 'Items deleted.' );
										},
									},
								},
								onError: {
									messages: {
										getOneItemMessage: ( error ) => {
											if ( error.size === 1 ) {
												return [ ...error ][ 0 ];
											}
											return isResetting
												? __(
														'An error occurred while reverting the item.'
												  )
												: __(
														'An error occurred while deleting the item.'
												  );
										},
										getMultipleItemMessage: ( errors ) => {
											if ( errors.size === 0 ) {
												return isResetting
													? __(
															'An error occurred while reverting the items.'
													  )
													: __(
															'An error occurred while deleting the items.'
													  );
											}

											if ( errors.size === 1 ) {
												return isResetting
													? sprintf(
															/* translators: %s: an error message */
															__(
																'An error occurred while reverting the items: %s'
															),
															[ ...errors ][ 0 ]
													  )
													: sprintf(
															/* translators: %s: an error message */
															__(
																'An error occurred while deleting the items: %s'
															),
															[ ...errors ][ 0 ]
													  );
											}

											return isResetting
												? sprintf(
														/* translators: %s: a list of comma separated error messages */
														__(
															'Some errors occurred while reverting the items: %s'
														),
														[ ...errors ].join(
															','
														)
												  )
												: sprintf(
														/* translators: %s: a list of comma separated error messages */
														__(
															'Some errors occurred while deleting the items: %s'
														),
														[ ...errors ].join(
															','
														)
												  );
										},
									},
								},
							};

							await deleteWithNotices( items, notice, {
								onActionPerformed,
							} );
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
