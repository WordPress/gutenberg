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
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../utils';
import type { Pattern } from '../../types';
import { decodeEntities } from '@wordpress/html-entities';
import { unlock } from '../../lock-unlock';
import type { NoticeSettings } from '../../mutation';
import { deleteWithNotices } from '../../mutation';

const { PATTERN_TYPES } = unlock( patternsPrivateApis );

const deletePatternAction: Action< Pattern > = {
	id: 'delete-pattern',
	label: __( 'Delete' ),
	isPrimary: true,
	icon: trash,
	isEligible( post ) {
		return post.type === PATTERN_TYPES.user;
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
							const notices: NoticeSettings< Pattern > = {
								success: {
									messages: {
										getMessage: ( item ) => {
											let title = '';
											if (
												typeof item.title === 'string'
											) {
												title = item.title;
											} else if (
												typeof item.title?.raw ===
												'string'
											) {
												title = item.title?.raw;
											} else if (
												'rendered' in item.title &&
												typeof item.title?.rendered ===
													'string'
											) {
												title = item.title?.rendered;
											}
											return sprintf(
												/* translators: The template/part's name. */
												__( '"%s" deleted.' ),
												decodeEntities( title )
											);
										},
										getBatchMessage: () =>
											__( 'Items deleted.' ),
									},
								},
								error: {
									messages: {
										getMessage: ( error ) => {
											if ( error.size === 1 ) {
												return sprintf(
													/* translators: The template/part's name. */
													__(
														'Could not delete "%s".'
													),
													[ ...error ][ 0 ]
												);
											}
											return __(
												'An error occurred while deleting the item.'
											);
										},
										getBatchMessage: ( errors ) => {
											if ( errors.size === 0 ) {
												return __(
													'An error occurred while deleting the items.'
												);
											}
											if ( errors.size === 1 ) {
												return sprintf(
													/* translators: %s: an error message */
													__(
														'An error occurred while deleting the items: %s'
													),
													[ ...errors ][ 0 ]
												);
											}
											return sprintf(
												/* translators: %s: a list of comma separated error messages */
												__(
													'Some errors occurred while deleting the items: %s'
												),
												[ ...errors ].join( ',' )
											);
										},
									},
								},
							};
							await deleteWithNotices( items, notices, {
								onActionPerformed,
								onActionError: () => void 0,
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

export default deletePatternAction;
