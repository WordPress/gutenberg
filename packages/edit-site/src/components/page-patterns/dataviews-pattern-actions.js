/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';
import { downloadZip } from 'client-zip';

/**
 * WordPress dependencies
 */
import { downloadBlob } from '@wordpress/blob';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import {
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_DEFAULT_CATEGORY,
} from '../../utils/constants';
import { CreateTemplatePartModalContents } from '../create-template-part-modal';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { CreatePatternModalContents, useDuplicatePatternProps } =
	unlock( patternsPrivateApis );

function getJsonFromItem( item ) {
	return JSON.stringify(
		{
			__file: item.type,
			title: item.title || item.name,
			content: item.patternPost.content.raw,
			syncStatus: item.patternPost.wp_pattern_sync_status,
		},
		null,
		2
	);
}

export const exportJSONaction = {
	id: 'export-pattern',
	label: __( 'Export as JSON' ),
	supportsBulk: true,
	isEligible: ( item ) => item.type === PATTERN_TYPES.user,
	callback: async ( items ) => {
		if ( items.length === 1 ) {
			return downloadBlob(
				`${ kebabCase( items[ 0 ].title || items[ 0 ].name ) }.json`,
				getJsonFromItem( items[ 0 ] ),
				'application/json'
			);
		}
		const nameCount = {};
		const filesToZip = items.map( ( item ) => {
			const name = kebabCase( item.title || item.name );
			nameCount[ name ] = ( nameCount[ name ] || 0 ) + 1;
			return {
				name: `${
					name +
					( nameCount[ name ] > 1
						? '-' + ( nameCount[ name ] - 1 )
						: '' )
				}.json`,
				lastModified: new Date(),
				input: getJsonFromItem( item ),
			};
		} );
		return downloadBlob(
			__( 'patterns-export' ) + '.zip',
			await downloadZip( filesToZip ).blob(),
			'application/zip'
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
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
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

const canDeleteOrReset = ( item ) => {
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const isUserPattern = item.type === PATTERN_TYPES.user;
	return isUserPattern || ( isTemplatePart && item.isCustom );
};

export const deleteAction = {
	id: 'delete-pattern',
	label: __( 'Delete' ),
	isEligible: ( item ) => {
		const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
		const hasThemeFile = isTemplatePart && item.templatePart.has_theme_file;
		return canDeleteOrReset( item ) && ! hasThemeFile;
	},
	hideModalHeader: true,
	supportsBulk: true,
	RenderModal: ( { items, closeModal, onPerform } ) => {
		const { __experimentalDeleteReusableBlock } =
			useDispatch( reusableBlocksStore );
		const { createErrorNotice, createSuccessNotice } =
			useDispatch( noticesStore );
		const { removeTemplates } = unlock( useDispatch( editorStore ) );

		const deletePattern = async () => {
			const promiseResult = await Promise.allSettled(
				items.map( ( item ) => {
					return __experimentalDeleteReusableBlock( item.id );
				} )
			);
			// If all the promises were fulfilled with success.
			if (
				promiseResult.every( ( { status } ) => status === 'fulfilled' )
			) {
				let successMessage;
				if ( promiseResult.length === 1 ) {
					successMessage = sprintf(
						/* translators: The posts's title. */
						__( '"%s" deleted.' ),
						items[ 0 ].title
					);
				} else {
					successMessage = __( 'The patterns were deleted.' );
				}
				createSuccessNotice( successMessage, {
					type: 'snackbar',
					id: 'edit-site-page-trashed',
				} );
			} else {
				// If there was at lease one failure.
				let errorMessage;
				// If we were trying to delete a single pattern.
				if ( promiseResult.length === 1 ) {
					if ( promiseResult[ 0 ].reason?.message ) {
						errorMessage = promiseResult[ 0 ].reason.message;
					} else {
						errorMessage = __(
							'An error occurred while deleting the pattern.'
						);
					}
					// If we were trying to delete multiple patterns.
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
							'An error occurred while deleting the patterns.'
						);
					} else if ( errorMessages.size === 1 ) {
						errorMessage = sprintf(
							/* translators: %s: an error message */
							__(
								'An error occurred while deleting the patterns: %s'
							),
							[ ...errorMessages ][ 0 ]
						);
					} else {
						errorMessage = sprintf(
							/* translators: %s: a list of comma separated error messages */
							__(
								'Some errors occurred while deleting the patterns: %s'
							),
							[ ...errorMessages ].join( ',' )
						);
					}
					createErrorNotice( errorMessage, {
						type: 'snackbar',
					} );
				}
			}
		};
		const deleteItem = () => {
			if ( items[ 0 ].type === TEMPLATE_PART_POST_TYPE ) {
				removeTemplates( items );
			} else {
				deletePattern();
			}
			if ( onPerform ) {
				onPerform();
			}
			closeModal();
		};
		let questionMessage;
		if ( items.length === 1 ) {
			questionMessage = sprintf(
				// translators: %s: The page's title.
				__( 'Are you sure you want to delete "%s"?' ),
				decodeEntities( items[ 0 ].title || items[ 0 ].name )
			);
		} else if (
			items.length > 1 &&
			items[ 0 ].type === TEMPLATE_PART_POST_TYPE
		) {
			questionMessage = sprintf(
				// translators: %d: The number of template parts (2 or more).
				__( 'Are you sure you want to delete %d template parts?' ),
				items.length
			);
		} else {
			questionMessage = sprintf(
				// translators: %d: The number of patterns (2 or more).
				__( 'Are you sure you want to delete %d patterns?' ),
				items.length
			);
		}
		return (
			<VStack spacing="5">
				<Text>{ questionMessage }</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button variant="primary" onClick={ deleteItem }>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export const resetAction = {
	id: 'reset-action',
	label: __( 'Reset' ),
	isEligible: ( item ) => {
		const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
		const hasThemeFile = isTemplatePart && item.templatePart.has_theme_file;
		return canDeleteOrReset( item ) && hasThemeFile;
	},
	hideModalHeader: true,
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const { removeTemplate } = useDispatch( editSiteStore );
		return (
			<VStack spacing="5">
				<Text>
					{ __( 'Reset to default and clear all customizations?' ) }
				</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ () => removeTemplate( item ) }
					>
						{ __( 'Reset' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export const duplicatePatternAction = {
	id: 'duplicate-pattern',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type !== TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate pattern', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const {
			params: { categoryId = PATTERN_DEFAULT_CATEGORY },
		} = useLocation();
		const isThemePattern = item.type === PATTERN_TYPES.theme;
		const history = useHistory();
		function onPatternSuccess( { pattern } ) {
			history.push( {
				categoryType: PATTERN_TYPES.theme,
				categoryId,
				postType: PATTERN_TYPES.user,
				postId: pattern.id,
			} );
			closeModal();
		}
		const duplicatedProps = useDuplicatePatternProps( {
			pattern: isThemePattern ? item : item.patternPost,
			onSuccess: onPatternSuccess,
		} );
		return (
			<CreatePatternModalContents
				onClose={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
				{ ...duplicatedProps }
			/>
		);
	},
};

export const duplicateTemplatePartAction = {
	id: 'duplicate-template-part',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type === TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate template part', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const { createSuccessNotice } = useDispatch( noticesStore );
		const {
			params: { categoryId = PATTERN_DEFAULT_CATEGORY },
		} = useLocation();
		const history = useHistory();
		function onTemplatePartSuccess( templatePart ) {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					item.title
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
			history.push( {
				postType: TEMPLATE_PART_POST_TYPE,
				postId: templatePart?.id,
				categoryType: TEMPLATE_PART_POST_TYPE,
				categoryId,
			} );
			closeModal();
		}
		return (
			<CreateTemplatePartModalContents
				blocks={ item.blocks }
				defaultArea={ item.templatePart.area }
				defaultTitle={ sprintf(
					/* translators: %s: Existing template part title */
					__( '%s (Copy)' ),
					item.title
				) }
				onCreate={ onTemplatePartSuccess }
				onError={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
			/>
		);
	},
};
