/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
// @ts-ignore
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import type { Action } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	getItemTitle,
	isTemplateOrTemplatePart,
	isTemplateRemovable,
} from './utils';
import type { Pattern, Template, TemplatePart } from '../types';
import type { NoticeSettings } from '../mutation';
import { deletePostWithNotices } from '../mutation';
import { unlock } from '../lock-unlock';

const { PATTERN_TYPES } = unlock( patternsPrivateApis );

// This action is used for templates, patterns and template parts.
// Every other post type uses the similar `trashPostAction` which
// moves the post to trash.
const deletePostAction: Action< Template | TemplatePart | Pattern > = {
	id: 'delete-post',
	label: __( 'Delete' ),
	isPrimary: true,
	icon: trash,
	isEligible( post ) {
		if ( isTemplateOrTemplatePart( post ) ) {
			return isTemplateRemovable( post );
		}
		// We can only remove user patterns.
		return post.type === PATTERN_TYPES.user;
	},
	supportsBulk: true,
	hideModalHeader: true,
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const isResetting = items.every(
			( item ) => isTemplateOrTemplatePart( item ) && item?.has_theme_file
		);
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
								// translators: %s: The template or template part's title
								_x( 'Delete "%s"?', 'template part' ),
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
							const notice: NoticeSettings<
								Template | TemplatePart | Pattern
							> = {
								success: {
									messages: {
										getMessage: ( item ) => {
											return isResetting
												? sprintf(
														/* translators: %s: The template/part's name. */
														__( '"%s" reset.' ),
														decodeEntities(
															getItemTitle( item )
														)
												  )
												: sprintf(
														/* translators: %s: The template/part's name. */
														_x(
															'"%s" deleted.',
															'template part'
														),
														decodeEntities(
															getItemTitle( item )
														)
												  );
										},
										getBatchMessage: () => {
											return isResetting
												? __( 'Items reset.' )
												: __( 'Items deleted.' );
										},
									},
								},
								error: {
									messages: {
										getMessage: ( error ) => {
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
										getBatchMessage: ( errors ) => {
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

							await deletePostWithNotices( items, notice, {
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

/**
 * Delete action for Templates, Patterns and Template Parts.
 */
export default deletePostAction;
