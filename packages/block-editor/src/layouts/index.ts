import flex from './flex';
import flow from './flow';
import constrained from './constrained';
import grid from './grid';
import type { LayoutType } from './types';

const layoutTypes: LayoutType[] = [ flow, flex, constrained, grid ];

/**
 * Retrieves a layout type by name.
 *
 * @param {string} name - The name of the layout type.
 * @return {Object} Layout type.
 */
export function getLayoutType( name = 'default' ): LayoutType | undefined {
	return layoutTypes.find( ( layoutType ) => layoutType.name === name );
}

/**
 * Retrieves the available layout types.
 *
 * @return {Array} Layout types.
 */
export function getLayoutTypes(): LayoutType[] {
	return layoutTypes;
}
