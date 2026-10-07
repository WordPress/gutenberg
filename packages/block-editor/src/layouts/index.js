import flex from './flex';
import flow from './flow';
import constrained from './constrained';
import grid from './grid';
import freeform from './freeform';

const layoutTypes = [ flow, flex, constrained, grid, freeform ];

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
 * The freeform canvas is experimental, so it is not offered as a choice unless
 * the experiment is on. It stays resolvable by name either way, so content that
 * already uses it keeps rendering.
 *
 * @return {Array} Layout types.
 */
export function getLayoutTypes() {
	if ( ! window.__experimentalEnableFreeformCanvas ) {
		return layoutTypes.filter(
			( layoutType ) => layoutType.name !== 'freeform'
		);
	}
	return layoutTypes;
}
