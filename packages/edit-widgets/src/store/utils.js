/**
 * "Kind" of the navigation post.
 *
 * @type {string}
 */
export const KIND = 'root';

/**
 * "post type" of the navigation post.
 *
 * @type {string}
 */
export const WIDGET_AREA_ENTITY_TYPE = 'sidebar';

/**
 * "post type" of the widget area post.
 *
 * @type {string}
 */
export const POST_TYPE = 'postType';

/**
 * Builds an ID for a new widget area post.
 *
 * @param {number} widgetAreaId Widget area id.
 * @return {string} An ID.
 */
export const buildWidgetAreaPostId = ( widgetAreaId ) =>
	`widget-area-${ widgetAreaId }`;

/**
 * Builds an ID for a global widget areas post.
 *
 * @return {string} An ID.
 */
export const buildWidgetAreasPostId = () => `widget-areas`;

/**
 * Builds a query to resolve sidebars.
 *
 * @return {Object} Query.
 */
export function buildWidgetAreasQuery() {
	return {};
}
