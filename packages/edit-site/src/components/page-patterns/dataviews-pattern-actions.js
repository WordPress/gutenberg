/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { downloadBlob } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES, TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

export const exportJSONaction = {
	id: 'duplicate-pattern',
	label: __( 'Export as JSON' ),
	isEligible: ( item ) => item.type === PATTERN_TYPES.user,
	callback: ( item ) => {
		const json = {
			__file: item.type,
			title: item.title || item.name,
			content: item.patternBlock.content.raw,
			syncStatus: item.patternBlock.wp_pattern_sync_status,
		};
		return downloadBlob(
			`${ kebabCase( item.title || item.name ) }.json`,
			JSON.stringify( json, null, 2 ),
			'application/json'
		);
	},
};

export const renameAction = {
	id: 'rename-pattern',
	label: __( 'Rename' ),
	isEligible: ( item ) => {
		const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
		const isUserPattern = item.type === PATTERN_TYPES.user;
		const isCustomPattern =
			isUserPattern || ( isTemplatePart && item.isCustom );
		const hasThemeFile = isTemplatePart && item.templatePart.has_theme_file;
		return isCustomPattern && ! hasThemeFile;
	},
	RenderModal: ( { item, closeModal } ) => {
		const [ title, setTitle ] = useState( () => item.title );
		const { editEntityRecord, saveEditedEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		async function onRename( event ) {
			event.preventDefault();
			try {
				await editEntityRecord( 'postType', item.type, item.id, {
					title,
				} );
				// Update state before saving rerenders the list.
				setTitle( '' );
				closeModal();
				// Persist edited entity.
				await saveEditedEntityRecord( 'postType', item.type, item.id, {
					throwOnError: true,
				} );
				createSuccessNotice(
					item.type === TEMPLATE_PART_POST_TYPE
						? __( 'Template part renamed.' )
						: __( 'Pattern renamed.' ),
					{ type: 'snackbar' }
				);
			} catch ( error ) {
				const fallbackErrorMessage =
					item.type === TEMPLATE_PART_POST_TYPE
						? __(
								'An error occurred while renaming the template part.'
						  )
						: __( 'An error occurred while renaming the pattern.' );
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: fallbackErrorMessage;
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}
		return (
			<form onSubmit={ onRename }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						required
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};
