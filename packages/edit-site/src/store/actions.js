/**
 * WordPress dependencies
 */
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import { controls, dispatch } from '@wordpress/data';
import { apiFetch } from '@wordpress/data-controls';
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
 * Returns an action object used to toggle a feature flag.
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
 * Returns an action object used to toggle the width of the editing canvas.
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
 * Returns an action object used to set a template.
 *
 * @param {number} templateId   The template ID.
 * @param {string} templateSlug The template slug.
 * @return {Object} Action object.
 */
export function* setTemplate( templateId, templateSlug ) {
	const pageContext = { templateSlug };
	if ( ! templateSlug ) {
		const template = yield controls.resolveSelect(
			coreStore,
			'getEntityRecord',
			'postType',
			'wp_template',
			templateId
		);
		pageContext.templateSlug = template?.slug;
	}
	return {
		type: 'SET_TEMPLATE',
		templateId,
		page: { context: pageContext },
	};
}

/**
 * Adds a new template, and sets it as the current template.
 *
 * @param {Object} template The template.
 *
 * @return {Object} Action object used to set the current template.
 */
export function* addTemplate( template ) {
	const newTemplate = yield controls.dispatch(
		coreStore,
		'saveEntityRecord',
		'postType',
		'wp_template',
		template
	);

	if ( template.content ) {
		yield controls.dispatch(
			coreStore,
			'editEntityRecord',
			'postType',
			'wp_template',
			newTemplate.id,
			{ blocks: parse( template.content ) },
			{ undoIgnore: true }
		);
	}

	return {
		type: 'SET_TEMPLATE',
		templateId: newTemplate.id,
		page: { context: { templateSlug: newTemplate.slug } },
	};
}

/**
 * Removes a template.
 *
 * @param {Object} template The template object.
 */
export function* removeTemplate( template ) {
	try {
		yield controls.dispatch(
			coreStore,
			'deleteEntityRecord',
			'postType',
			template.type,
			template.id,
			{ force: true }
		);

		const lastError = yield controls.select(
			coreStore,
			'getLastEntityDeleteError',
			'postType',
			template.type,
			template.id
		);

		if ( lastError ) {
			throw lastError;
		}

		yield controls.dispatch(
			noticesStore,
			'createSuccessNotice',
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

		yield controls.dispatch(
			noticesStore,
			'createErrorNotice',
			errorMessage,
			{ type: 'snackbar' }
		);
	}
}

/**
 * Returns an action object used to set a template part.
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
 * Updates the homeTemplateId state with the templateId of the page resolved
 * from the given path.
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
export function* setPage( page ) {
	if ( ! page.path && page.context?.postId ) {
		const entity = yield controls.resolveSelect(
			coreStore,
			'getEntityRecord',
			'postType',
			page.context.postType || 'post',
			page.context.postId
		);
		// If the entity is undefined for some reason, path will resolve to "/"
		page.path = getPathAndQueryString( entity?.link );
	}
	const template = yield controls.resolveSelect(
		coreStore,
		'__experimentalGetTemplateForLink',
		page.path
	);

	if ( ! template ) {
		return;
	}

	const { id: templateId, slug: templateSlug } = template;
	yield {
		type: 'SET_PAGE',
		page: ! templateSlug
			? page
			: {
					...page,
					context: {
						...page.context,
						templateSlug,
					},
			  },
		templateId,
	};
	return templateId;
}

/**
 * Returns an action object used to set the active navigation panel menu.
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
 * Returns an action object used to open/close the inserter.
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
export function* revertTemplate( template, { allowUndo = true } = {} ) {
	if ( ! isTemplateRevertable( template ) ) {
		yield controls.dispatch(
			noticesStore,
			'createErrorNotice',
			__( 'This template is not revertable.' ),
			{ type: 'snackbar' }
		);
		return;
	}

	try {
		const templateEntity = yield controls.select(
			coreStore,
			'getEntity',
			'postType',
			template.type
		);
		if ( ! templateEntity ) {
			yield controls.dispatch(
				noticesStore,
				'createErrorNotice',
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
		const fileTemplate = yield apiFetch( { path: fileTemplatePath } );
		if ( ! fileTemplate ) {
			yield controls.dispatch(
				noticesStore,
				'createErrorNotice',
				__(
					'The editor has encountered an unexpected error. Please reload.'
				),
				{ type: 'snackbar' }
			);
			return;
		}

		const serializeBlocks = ( { blocks: blocksForSerialization = [] } ) =>
			__unstableSerializeAndClean( blocksForSerialization );
		const edited = yield controls.select(
			coreStore,
			'getEditedEntityRecord',
			'postType',
			template.type,
			template.id
		);
		// We are fixing up the undo level here to make sure we can undo
		// the revert in the header toolbar correctly.
		yield controls.dispatch(
			coreStore,
			'editEntityRecord',
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
		yield controls.dispatch(
			coreStore,
			'editEntityRecord',
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
			const undoRevert = async () => {
				await dispatch( coreStore ).editEntityRecord(
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
			yield controls.dispatch(
				noticesStore,
				'createSuccessNotice',
				__( 'Template reverted.' ),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: undoRevert,
						},
					],
				}
			);
		} else {
			yield controls.dispatch(
				noticesStore,
				'createSuccessNotice',
				__( 'Template reverted.' )
			);
		}
	} catch ( error ) {
		const errorMessage =
			error.message && error.code !== 'unknown_error'
				? error.message
				: __( 'Template revert failed. Please reload.' );
		yield controls.dispatch(
			noticesStore,
			'createErrorNotice',
			errorMessage,
			{ type: 'snackbar' }
		);
	}
}
/**
 * Returns an action object used in signalling that the user opened an editor sidebar.
 *
 * @param {?string} name Sidebar name to be opened.
 *
 * @yield {Object} Action object.
 */
export function* openGeneralSidebar( name ) {
	yield controls.dispatch(
		interfaceStore,
		'enableComplementaryArea',
		editSiteStoreName,
		name
	);
}

/**
 * Returns an action object signalling that the user closed the sidebar.
 *
 * @yield {Object} Action object.
 */
export function* closeGeneralSidebar() {
	yield controls.dispatch(
		interfaceStore,
		'disableComplementaryArea',
		editSiteStoreName
	);
}

export function* switchEditorMode( mode ) {
	yield {
		type: 'SWITCH_MODE',
		mode,
	};

	// Unselect blocks when we switch to a non visual mode.
	if ( mode !== 'visual' ) {
		yield controls.dispatch( blockEditorStore.name, 'clearSelectedBlock' );
	}
	const messages = {
		visual: __( 'Visual editor selected' ),
		mosaic: __( 'Mosaic view selected' ),
	};
	if ( messages[ mode ] ) {
		speak( messages[ mode ], 'assertive' );
	}
}
