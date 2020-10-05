/**
 * "Kind" of the widget area entity.
 *
 * @type {string}
 */
export const KIND = 'root';

/**
 * Type of the widget area entity.
 *
 * @type {string}
 */
export const WIDGET_AREA_ENTITY_TYPE = 'sidebar';

/**
 * Type of the widget area editor entity.
 *
 * @type {string}
 */
export const EDITOR_TYPE = 'editor';

/**
 * Builds an ID for a new widget area editor.
 *
 * @param {number} widgetAreaId Widget area id.
 * @return {string} An ID.
 */
export const buildWidgetAreaEditorRecordId = ( widgetAreaId ) =>
	`widget-area-${ widgetAreaId }`;

/**
 * Builds an ID for a global widget areas editor.
 *
 * @return {string} An ID.
 */
export const buildWidgetAreasEditorRecordId = () => `widget-areas`;

/**
 * Builds a query to resolve sidebars.
 *
 * @return {Object} Query.
 */
export function buildWidgetAreasQuery() {
	return {};
}
