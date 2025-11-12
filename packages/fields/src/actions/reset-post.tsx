/**
 * WordPress dependencies
 */
import { backup } from '@wordpress/icons';
import { dispatch, select, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
// @ts-ignore
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getItemTitle } from './utils';
import type { CoreDataError, TemplatePart } from '../types';

const isTemplateRevertable = ( templateOrTemplatePart: TemplatePart ) => {
	if ( ! templateOrTemplatePart ) {
		return false;
	}

	return (
		templateOrTemplatePart.source === 'custom' &&
		( Boolean( templateOrTemplatePart?.plugin ) ||
			templateOrTemplatePart?.has_theme_file )
	);
};

/**
 *  Copied - pasted from https://github.com/WordPress/gutenberg/blob/bf1462ad37d4637ebbf63270b9c244b23c69e2a8/packages/editor/src/store/private-actions.js#L233-L365
 *
 * @param {Object}  template            The template to revert.
 * @param {Object}  [options]
 * @param {boolean} [options.allowUndo] Whether to allow the user to undo
 *                                      reverting the template. Default true.
 */
const revertTemplate = async (
	template: TemplatePart,
	{ allowUndo = true } = {}
) => {
	const noticeId = 'edit-site-template-reverted';
	dispatch( noticesStore ).removeNotice( noticeId );
	if ( ! isTemplateRevertable( template ) ) {
		dispatch( noticesStore ).createErrorNotice(
			__( 'This template is not revertable.' ),
			{
				type: 'snackbar',
			}
		);
		return;
	}

	try {
		const templateEntityConfig = select( coreStore ).getEntityConfig(
			'postType',
			template.type
		);

		if ( ! templateEntityConfig ) {
			dispatch( noticesStore ).createErrorNotice(
				__(
					'The editor has encountered an unexpected error. Please reload.'
				),
				{ type: 'snackbar' }
			);
			return;
		}

		const fileTemplatePath = addQueryArgs(
			`${ templateEntityConfig.baseURL }/${ template.id }`,
			{ context: 'edit', source: template.origin }
		);

		const fileTemplate = ( await apiFetch( {
			path: fileTemplatePath,
		} ) ) as any;
		if ( ! fileTemplate ) {
			dispatch( noticesStore ).createErrorNotice(
				__(
					'The editor has encountered an unexpected error. Please reload.'
				),
				{ type: 'snackbar' }
			);
			return;
		}

		const serializeBlocks = ( { blocks: blocksForSerialization = [] } ) =>
			__unstableSerializeAndClean( blocksForSerialization );

		const edited = select( coreStore ).getEditedEntityRecord(
			'postType',
			template.type,
			template.id
		) as any;

		// We are fixing up the undo level here to make sure we can undo
		// the revert in the header toolbar correctly.
		dispatch( coreStore ).editEntityRecord(
			'postType',
			template.type,
			template.id,
			{
				content: serializeBlocks, // Required to make the `undo` behave correctly.
				blocks: edited.blocks, // Required to revert the blocks in the editor.
				source: 'custom', // required to avoid turning the editor into a dirty state
			},
			{
				undoIgnore: true, // Required to merge this edit with the last undo level.
			}
		);

		const blocks = parse( fileTemplate?.content?.raw );

		dispatch( coreStore ).editEntityRecord(
			'postType',
			template.type,
			fileTemplate.id,
			{
				content: serializeBlocks,
				blocks,
				source: 'theme',
			}
		);

		if ( allowUndo ) {
			const undoRevert = () => {
				dispatch( coreStore ).editEntityRecord(
					'postType',
					template.type,
					edited.id,
					{
						content: serializeBlocks,
						blocks: edited.blocks,
						source: 'custom',
					}
				);
			};

			dispatch( noticesStore ).createSuccessNotice(
				__( 'Template reset.' ),
				{
					type: 'snackbar',
					id: noticeId,
					actions: [
						{
							label: __( 'Undo' ),
							onClick: undoRevert,
						},
					],
				}
			);
		}
	} catch ( error: any ) {
		const errorMessage =
			error.message && error.code !== 'unknown_error'
				? error.message
				: __( 'Template revert failed. Please reload.' );

		dispatch( noticesStore ).createErrorNotice( errorMessage, {
			type: 'snackbar',
		} );
	}
};

const resetPostAction: Action< TemplatePart > = {
	id: 'reset-post',
	label: __( 'Reset' ),
	isEligible: ( item ) => {
		return (
			item.type === 'wp_template_part' &&
			item?.source === 'custom' &&
			item?.has_theme_file
		);
	},
	icon: backup,
	supportsBulk: true,
	hideModalHeader: true,
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );

		const { saveEditedEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const onConfirm = async () => {
			try {
				for ( const template of items ) {
					await revertTemplate( template, {
						allowUndo: false,
					} );
					await saveEditedEntityRecord(
						'postType',
						template.type,
						template.id
					);
				}
				createSuccessNotice(
					items.length > 1
						? sprintf(
								/* translators: %d: The number of items. */
								__( '%d items reset.' ),
								items.length
						  )
						: sprintf(
								/* translators: %s: The template/part's name. */
								__( '"%s" reset.' ),
								getItemTitle( items[ 0 ] )
						  ),
					{
						type: 'snackbar',
						id: 'revert-template-action',
					}
				);
			} catch ( error ) {
				const fallbackErrorMessage =
					items.length === 1
						? __(
								'An error occurred while reverting the template part.'
						  )
						: __(
								'An error occurred while reverting the template parts.'
						  );

				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
						: fallbackErrorMessage;

				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		};
		return (
			<VStack spacing="5">
				<Text>
					{ __( 'Reset to default and clear all customizations?' ) }
				</Text>
				<HStack justify="right">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							await onConfirm();
							onActionPerformed?.( items );
							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Reset' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

/**
 * Reset action for Template and TemplatePart.
 */
export default resetPostAction;
