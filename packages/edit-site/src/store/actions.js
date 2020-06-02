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
 * Returns an action object used to add a template.
 *
 * @param {number} templateId The template ID.
 *
 * @return {Object} Action object.
 */
export function addTemplate( templateId ) {
	return {
		type: 'ADD_TEMPLATE',
		templateId,
	};
}

/**
 * Returns an action object used to remove a template.
 *
 * @param {number} templateId The template ID.
 *
 * @return {Object} Action object.
 */
export function removeTemplate( templateId ) {
	return {
		type: 'REMOVE_TEMPLATE',
		templateId,
	};
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
 * Resolves the template for a page and sets them.
 *
 * @param {Object} page         The page object.
 * @param {string} page.type    The page type.
 * @param {string} page.slug    The page slug.
 * @param {string} page.path    The page path.
 * @param {Object} page.context The page context.
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
