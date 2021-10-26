/**
 * Internal dependencies
 */
import flex from './flex';
import flow from './flow';

const layoutTypes = [ flow, flex ];

/**
 * Retrieves a layout type by name.
 *
 * @param {string} name - The name of the layout type.
 * @return {Object} Layout type.
 */
export function getLayoutType( name = 'default' ) {
	return layoutTypes.find( ( layoutType ) => layoutType.name === name );
}

/**
 * Retrieves the available layout types.
 *
 * @return {Array} Layout types.
 */
export function getLayoutTypes() {
	return layoutTypes;
}
