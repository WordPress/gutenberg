/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import { addQueryArgs, getPathAndQueryString } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { STORE_NAME as editSiteStoreName } from './constants';
import isTemplateRevertable from '../utils/is-template-revertable';

/**
 * Action that toggles a feature flag.
 *
 * @param {string} feature Feature name.
 *
 * @return {Object} Action object.
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}

/**
 * Action that changes the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function __experimentalSetPreviewDeviceType( deviceType ) {
	return {
		type: 'SET_PREVIEW_DEVICE_TYPE',
		deviceType,
	};
}

/**
 * Action that sets a template, optionally fetching it from REST API.
 *
 * @param {number} templateId   The template ID.
 * @param {string} templateSlug The template slug.
 * @return {Object} Action object.
 */
export const setTemplate = ( templateId, templateSlug ) => async ( {
	dispatch,
	registry,
} ) => {
	if ( ! templateSlug ) {
		const template = await registry
			.resolveSelect( coreStore )
			.getEntityRecord( 'postType', 'wp_template', templateId );
		templateSlug = template?.slug;
	}

	dispatch( {
		type: 'SET_TEMPLATE',
		templateId,
		page: { context: { templateSlug } },
	} );
};

/**
 * Action that adds a new template and sets it as the current template.
 *
 * @param {Object} template The template.
 *
 * @return {Object} Action object used to set the current template.
 */
export const addTemplate = ( template ) => async ( { dispatch, registry } ) => {
	const newTemplate = await registry
		.dispatch( coreStore )
		.saveEntityRecord( 'postType', 'wp_template', template );

	if ( template.content ) {
		registry
			.dispatch( coreStore )
			.editEntityRecord(
				'postType',
				'wp_template',
				newTemplate.id,
				{ blocks: parse( template.content ) },
				{ undoIgnore: true }
			);
	}

	dispatch( {
		type: 'SET_TEMPLATE',
		templateId: newTemplate.id,
		page: { context: { templateSlug: newTemplate.slug } },
	} );
};

/**
 * Action that removes a template.
 *
 * @param {Object} template The template object.
 */
export const removeTemplate = ( template ) => async ( { registry } ) => {
	try {
		await registry
			.dispatch( coreStore )
			.deleteEntityRecord( 'postType', template.type, template.id, {
				force: true,
			} );

		const lastError = registry
			.select( coreStore )
			.getLastEntityDeleteError( 'postType', template.type, template.id );

		if ( lastError ) {
			throw lastError;
		}

		registry.dispatch( noticesStore ).createSuccessNotice(
			sprintf(
				/* translators: The template/part's name. */
				__( '"%s" deleted.' ),
				template.title.rendered
			),
			{ type: 'snackbar' }
		);
	} catch ( error ) {
		const errorMessage =
			error.message && error.code !== 'unknown_error'
				? error.message
				: __( 'An error occurred while deleting the template.' );

		registry
			.dispatch( noticesStore )
			.createErrorNotice( errorMessage, { type: 'snackbar' } );
	}
};

/**
 * Action that sets a template part.
 *
 * @param {string} templatePartId The template part ID.
 *
 * @return {Object} Action object.
 */
export function setTemplatePart( templatePartId ) {
	return {
		type: 'SET_TEMPLATE_PART',
		templatePartId,
	};
}

/**
 * Action that sets the home template ID to the template ID of the page resolved
 * from a given path.
 *
 * @param {number} homeTemplateId The template ID for the homepage.
 */
export function setHomeTemplateId( homeTemplateId ) {
	return {
		type: 'SET_HOME_TEMPLATE',
		homeTemplateId,
	};
}

/**
 * Resolves the template for a page and displays both. If no path is given, attempts
 * to use the postId to generate a path like `?p=${ postId }`.
 *
 * @param {Object} page         The page object.
 * @param {string} page.type    The page type.
 * @param {string} page.slug    The page slug.
 * @param {string} page.path    The page path.
 * @param {Object} page.context The page context.
 *
 * @return {number} The resolved template ID for the page route.
 */
export const setPage = ( page ) => async ( { dispatch, registry } ) => {
	if ( ! page.path && page.context?.postId ) {
		const entity = await registry
			.resolveSelect( coreStore )
			.getEntityRecord(
				'postType',
				page.context.postType || 'post',
				page.context.postId
			);
		// If the entity is undefined for some reason, path will resolve to "/"
		page.path = getPathAndQueryString( entity?.link );
	}

	const template = await registry
		.resolveSelect( coreStore )
		.__experimentalGetTemplateForLink( page.path );

	if ( ! template ) {
		return;
	}

	dispatch( {
		type: 'SET_PAGE',
		page: template.slug
			? {
					...page,
					context: {
						...page.context,
						templateSlug: template.slug,
					},
			  }
			: page,
		templateId: template.id,
	} );

	return template.id;
};

/**
 * Action that sets the active navigation panel menu.
 *
 * @param {string} menu Menu prop of active menu.
 *
 * @return {Object} Action object.
 */
export function setNavigationPanelActiveMenu( menu ) {
	return {
		type: 'SET_NAVIGATION_PANEL_ACTIVE_MENU',
		menu,
	};
}

/**
 * Opens the navigation panel and sets its active menu at the same time.
 *
 * @param {string} menu Identifies the menu to open.
 */
export function openNavigationPanelToMenu( menu ) {
	return {
		type: 'OPEN_NAVIGATION_PANEL_TO_MENU',
		menu,
	};
}

/**
 * Sets whether the navigation panel should be open.
 *
 * @param {boolean} isOpen If true, opens the nav panel. If false, closes it. It
 *                         does not toggle the state, but sets it directly.
 */
export function setIsNavigationPanelOpened( isOpen ) {
	return {
		type: 'SET_IS_NAVIGATION_PANEL_OPENED',
		isOpen,
	};
}

/**
 * Opens or closes the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 *
 * @return {Object} Action object.
 */
export function setIsInserterOpened( value ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		value,
	};
}

/**
 * Returns an action object used to update the settings.
 *
 * @param {Object} settings New settings.
 *
 * @return {Object} Action object.
 */
export function updateSettings( settings ) {
	return {
		type: 'UPDATE_SETTINGS',
		settings,
	};
}

/**
 * Sets whether the list view panel should be open.
 *
 * @param {boolean} isOpen If true, opens the list view. If false, closes it.
 *                         It does not toggle the state, but sets it directly.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Reverts a template to its original theme-provided file.
 *
 * @param {Object}  template            The template to revert.
 * @param {Object}  [options]
 * @param {boolean} [options.allowUndo] Whether to allow the user to undo
 *                                      reverting the template. Default true.
 */
export const revertTemplate = (
	template,
	{ allowUndo = true } = {}
) => async ( { registry } ) => {
	if ( ! isTemplateRevertable( template ) ) {
		registry
			.dispatch( noticesStore )
			.createErrorNotice( __( 'This template is not revertable.' ), {
				type: 'snackbar',
			} );
		return;
	}

	try {
		const templateEntity = registry
			.select( coreStore )
			.getEntity( 'postType', template.type );

		if ( ! templateEntity ) {
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
			`${ templateEntity.baseURL }/${ template.id }`,
			{ context: 'edit', source: 'theme' }
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

		const serializeBlocks = ( { blocks: blocksForSerialization = [] } ) =>
			__unstableSerializeAndClean( blocksForSerialization );

		const edited = registry
			.select( coreStore )
			.getEditedEntityRecord( 'postType', template.type, template.id );

		// We are fixing up the undo level here to make sure we can undo
		// the revert in the header toolbar correctly.
		registry.dispatch( coreStore ).editEntityRecord(
			'postType',
			template.type,
			template.id,
			{
				content: serializeBlocks, // required to make the `undo` behave correctly
				blocks: edited.blocks, // required to revert the blocks in the editor
				source: 'custom', // required to avoid turning the editor into a dirty state
			},
			{
				undoIgnore: true, // required to merge this edit with the last undo level
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
					.editEntityRecord( 'postType', template.type, edited.id, {
						content: serializeBlocks,
						blocks: edited.blocks,
						source: 'custom',
					} );
			};

			registry
				.dispatch( noticesStore )
				.createSuccessNotice( __( 'Template reverted.' ), {
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: undoRevert,
						},
					],
				} );
		} else {
			registry
				.dispatch( noticesStore )
				.createSuccessNotice( __( 'Template reverted.' ) );
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
 * Action that opens an editor sidebar.
 *
 * @param {?string} name Sidebar name to be opened.
 */
export const openGeneralSidebar = ( name ) => ( { registry } ) => {
	registry
		.dispatch( interfaceStore )
		.enableComplementaryArea( editSiteStoreName, name );
};

/**
 * Action that closes the sidebar.
 */
export const closeGeneralSidebar = () => ( { registry } ) => {
	registry
		.dispatch( interfaceStore )
		.disableComplementaryArea( editSiteStoreName );
};

export const switchEditorMode = ( mode ) => ( { dispatch, registry } ) => {
	dispatch( { type: 'SWITCH_MODE', mode } );

	// Unselect blocks when we switch to a non visual mode.
	if ( mode !== 'visual' ) {
		registry.dispatch( blockEditorStore ).clearSelectedBlock();
	}

	if ( mode === 'visual' ) {
		speak( __( 'Visual editor selected' ), 'assertive' );
	} else if ( mode === 'mosaic' ) {
		speak( __( 'Mosaic view selected' ), 'assertive' );
	}
};
