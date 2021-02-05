/**
 * WordPress dependencies
 */
import { controls } from '@wordpress/data';
import { apiFetch } from '@wordpress/data-controls';
import { getPathAndQueryString } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { STORE_NAME as editSiteStoreName } from './constants';

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
 * @param {number} templateId The template ID.
 * @param {string} templateSlug The template slug.
 * @return {Object} Action object.
 */
export function* setTemplate( templateId, templateSlug ) {
	const pageContext = { templateSlug };
	if ( ! templateSlug ) {
		const template = yield controls.resolveSelect(
			'core',
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
		'core',
		'saveEntityRecord',
		'postType',
		'wp_template',
		template
	);
	return {
		type: 'SET_TEMPLATE',
		templateId: newTemplate.id,
		page: { context: { templateSlug: newTemplate.slug } },
	};
}

/**
 * Removes a template, and updates the current page and template.
 *
 * @param {number} templateId The template ID.
 */
export function* removeTemplate( templateId ) {
	yield apiFetch( {
		path: `/wp/v2/templates/${ templateId }`,
		method: 'DELETE',
	} );
	const page = yield controls.select( editSiteStoreName, 'getPage' );
	yield controls.dispatch( editSiteStoreName, 'setPage', page );
}

/**
 * Returns an action object used to set a template part.
 *
 * @param {number} templatePartId The template part ID.
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
 * @param {Object}  page         The page object.
 * @param {string}  page.type    The page type.
 * @param {string}  page.slug    The page slug.
 * @param {string}  page.path    The page path.
 * @param {Object}  page.context The page context.
 *
 * @return {number} The resolved template ID for the page route.
 */
export function* setPage( page ) {
	if ( ! page.path && page.context?.postId ) {
		const entity = yield controls.resolveSelect(
			'core',
			'getEntityRecord',
			'postType',
			page.context.postType || 'post',
			page.context.postId
		);

		page.path = getPathAndQueryString( entity.link );
	}
	const { id: templateId, slug: templateSlug } = yield controls.resolveSelect(
		'core',
		'__experimentalGetTemplateForLink',
		page.path
	);
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
 * Displays the site homepage for editing in the editor.
 */
export function* showHomepage() {
	const {
		show_on_front: showOnFront,
		page_on_front: frontpageId,
	} = yield controls.resolveSelect(
		'core',
		'getEntityRecord',
		'root',
		'site'
	);

	const { siteUrl } = yield controls.select(
		editSiteStoreName,
		'getSettings'
	);

	const page = {
		path: siteUrl,
		context:
			showOnFront === 'page'
				? {
						postType: 'page',
						postId: frontpageId,
				  }
				: {},
	};

	const homeTemplate = yield* setPage( page );
	yield setHomeTemplateId( homeTemplate );
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
 * Sets whether the block inserter panel should be open.
 *
 * @param {boolean} isOpen If true, opens the inserter. If false, closes it. It
 *                         does not toggle the state, but sets it directly.
 */
export function setIsInserterOpened( isOpen ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		isOpen,
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
