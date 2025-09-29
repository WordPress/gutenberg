/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import isTemplateRevertable from './utils/is-template-revertable';
export * from '../dataviews/store/private-actions';

/**
 * Returns an action object used to set which template is currently being used/edited.
 *
 * @param {string} id Template Id.
 *
 * @return {Object} Action object.
 */
export function setCurrentTemplateId( id ) {
	return {
		type: 'SET_CURRENT_TEMPLATE_ID',
		id,
	};
}

/**
 * Create a block based template.
 *
 * @param {?Object} template Template to create and assign.
 */
export const createTemplate =
	( template ) =>
	async ( { select, dispatch, registry } ) => {
		const savedTemplate = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', 'wp_template', template );
		registry
			.dispatch( coreStore )
			.editEntityRecord(
				'postType',
				select.getCurrentPostType(),
				select.getCurrentPostId(),
				{
					template: savedTemplate.slug,
				}
			);
		registry
			.dispatch( noticesStore )
			.createSuccessNotice(
				__( "Custom template created. You're in template mode now." ),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Go back' ),
							onClick: () =>
								dispatch.setRenderingMode(
									select.getEditorSettings()
										.defaultRenderingMode
								),
						},
					],
				}
			);
		return savedTemplate;
	};

/**
 * Update the provided block types to be visible.
 *
 * @param {string[]} blockNames Names of block types to show.
 */
export const showBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		const existingBlockNames =
			registry
				.select( preferencesStore )
				.get( 'core', 'hiddenBlockTypes' ) ?? [];

		const newBlockNames = existingBlockNames.filter(
			( type ) =>
				! (
					Array.isArray( blockNames ) ? blockNames : [ blockNames ]
				).includes( type )
		);

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'hiddenBlockTypes', newBlockNames );
	};

/**
 * Update the provided block types to be hidden.
 *
 * @param {string[]} blockNames Names of block types to hide.
 */
export const hideBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		const existingBlockNames =
			registry
				.select( preferencesStore )
				.get( 'core', 'hiddenBlockTypes' ) ?? [];

		const mergedBlockNames = new Set( [
			...existingBlockNames,
			...( Array.isArray( blockNames ) ? blockNames : [ blockNames ] ),
		] );

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'hiddenBlockTypes', [ ...mergedBlockNames ] );
	};

/**
 * Reverts a template to its original theme-provided file.
 *
 * @param {Object}  template            The template to revert.
 * @param {Object}  [options]
 * @param {boolean} [options.allowUndo] Whether to allow the user to undo
 *                                      reverting the template. Default true.
 */
export const revertTemplate =
	( template, { allowUndo = true } = {} ) =>
	async ( { registry } ) => {
		const noticeId = 'edit-site-template-reverted';
		registry.dispatch( noticesStore ).removeNotice( noticeId );
		if ( ! isTemplateRevertable( template ) ) {
			registry
				.dispatch( noticesStore )
				.createErrorNotice( __( 'This template is not revertable.' ), {
					type: 'snackbar',
				} );
			return;
		}

		try {
			const templateEntityConfig = registry
				.select( coreStore )
				.getEntityConfig( 'postType', template.type );

			if ( ! templateEntityConfig ) {
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
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

			const fileTemplate = await apiFetch( { path: fileTemplatePath } );
			if ( ! fileTemplate ) {
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						__(
							'The editor has encountered an unexpected error. Please reload.'
						),
						{ type: 'snackbar' }
					);
				return;
			}

			const serializeBlocks = ( {
				blocks: blocksForSerialization = [],
			} ) => __unstableSerializeAndClean( blocksForSerialization );

			const edited = registry
				.select( coreStore )
				.getEditedEntityRecord(
					'postType',
					template.type,
					template.id
				);

			// We are fixing up the undo level here to make sure we can undo
			// the revert in the header toolbar correctly.
			registry.dispatch( coreStore ).editEntityRecord(
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
			registry
				.dispatch( coreStore )
				.editEntityRecord( 'postType', template.type, fileTemplate.id, {
					content: serializeBlocks,
					blocks,
					source: 'theme',
				} );

			if ( allowUndo ) {
				const undoRevert = () => {
					registry
						.dispatch( coreStore )
						.editEntityRecord(
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

				registry
					.dispatch( noticesStore )
					.createSuccessNotice( __( 'Template reset.' ), {
						type: 'snackbar',
						id: noticeId,
						actions: [
							{
								label: __( 'Undo' ),
								onClick: undoRevert,
							},
						],
					} );
			}
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'Template revert failed. Please reload.' );
			registry
				.dispatch( noticesStore )
				.createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

/**
 * Action that removes an array of templates, template parts or patterns.
 *
 * @param {Array} items An array of template,template part or pattern objects to remove.
 */
export const removeTemplates =
	( items ) =>
	async ( { registry } ) => {
		const isResetting = items.every( ( item ) => item?.has_theme_file );

		const promiseResult = await Promise.allSettled(
			items.map( ( item ) => {
				return registry
					.dispatch( coreStore )
					.deleteEntityRecord(
						'postType',
						item.type,
						item.id,
						{ force: true },
						{ throwOnError: true }
					);
			} )
		);

		// If all the promises were fulfilled with success.
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			let successMessage;

			if ( items.length === 1 ) {
				// Depending on how the entity was retrieved its title might be
				// an object or simple string.
				let title;
				if ( typeof items[ 0 ].title === 'string' ) {
					title = items[ 0 ].title;
				} else if ( typeof items[ 0 ].title?.rendered === 'string' ) {
					title = items[ 0 ].title?.rendered;
				} else if ( typeof items[ 0 ].title?.raw === 'string' ) {
					title = items[ 0 ].title?.raw;
				}
				successMessage = isResetting
					? sprintf(
							/* translators: %s: The template/part's name. */
							__( '"%s" reset.' ),
							decodeEntities( title )
					  )
					: sprintf(
							/* translators: %s: The template/part's name. */
							_x( '"%s" deleted.', 'template part' ),
							decodeEntities( title )
					  );
			} else {
				successMessage = isResetting
					? __( 'Items reset.' )
					: __( 'Items deleted.' );
			}

			registry
				.dispatch( noticesStore )
				.createSuccessNotice( successMessage, {
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
			registry
				.dispatch( noticesStore )
				.createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

/**
 * Set the default rendering mode preference for the current post type.
 *
 * @param {string} mode The rendering mode to set as default.
 */
export const setDefaultRenderingMode =
	( mode ) =>
	( { select, registry } ) => {
		const postType = select.getCurrentPostType();
		const theme = registry
			.select( coreStore )
			.getCurrentTheme()?.stylesheet;
		const renderingModes =
			registry
				.select( preferencesStore )
				.get( 'core', 'renderingModes' )?.[ theme ] ?? {};

		if ( renderingModes[ postType ] === mode ) {
			return;
		}

		const newModes = {
			[ theme ]: {
				...renderingModes,
				[ postType ]: mode,
			},
		};

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'renderingModes', newModes );
	};
