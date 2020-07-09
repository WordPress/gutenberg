/**
 * WordPress dependencies
 */
import { select, dispatch, apiFetch } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { findTemplate } from './controls';

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
 *
 * @return {Object} Action object.
 */
export function setTemplate( templateId ) {
	return {
		type: 'SET_TEMPLATE',
		templateId,
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
	const newTemplate = yield dispatch(
		'core',
		'saveEntityRecord',
		'postType',
		'wp_template',
		template
	);
	return {
		type: 'SET_TEMPLATE',
		templateId: newTemplate.id,
	};
}

/**
 * Removes a template, and updates the current page and template.
 *
 * @param {number} templateId The template ID.
 *
 * @return {Object} Action object used to set the current page and template.
 */
export function* removeTemplate( templateId ) {
	yield apiFetch( {
		path: `/wp/v2/templates/${ templateId }`,
		method: 'DELETE',
	} );
	return dispatch(
		'core/edit-site',
		'setPage',
		yield select( 'core/edit-site', 'getPage' )
	);
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
 * @param {string} path The path to the page which should be set as the homepage.
 */
export function* setHomeTemplatePath( path ) {
	const homeTemplateId = yield findTemplate( path );
	dispatch( {
		type: 'SET_HOME_TEMPLATE',
		homeTemplateId,
	} );
}

/**
 * Resolves the template for a page and sets them.
 *
 * @param {Object}  page         The page object.
 * @param {string}  page.type    The page type.
 * @param {string}  page.slug    The page slug.
 * @param {string}  page.path    The page path.
 * @param {Object}  page.context The page context.
 *
 * @return {Object} Action object.
 */
export function* setPage( page ) {
	const templateId = yield findTemplate( page.path );
	return {
		type: 'SET_PAGE',
		page,
		templateId,
	};
}
