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
	return {
		per_page: -1,
	};
}

/**
 * Builds a query to resolve widgets.
 *
 * @return {Object} Query.
 */
export function buildWidgetsQuery() {
	return {
		per_page: -1,
		_embed: 'about',
	};
}

/**
 * Creates a stub post with given id and set of blocks. Used as a governing entity records
 * for all widget areas.
 *
 * @param {string} id     Post ID.
 * @param {Array}  blocks The list of blocks.
 * @return {Object} A stub post object formatted in compliance with the data layer.
 */
export const createStubPost = ( id, blocks ) => ( {
	id,
	slug: id,
	status: 'draft',
	type: 'page',
	blocks,
	meta: {
		widgetAreaId: id,
	},
} );
