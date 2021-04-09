/**
 * Internal dependencies
 */
import { createCoreElement } from './create-core-element';
import { tags } from './tags';

/**
 * @typedef CreateCoreElementProps
 * @property {import('create-emotion').ObjectInterpolation<any>} baseStyles Base styles for the coreElements.
 * @property {import('../create-compiler').Compiler} compiler The injectGlobal from the Style system's compiler.
 * @property {import('./generate-theme').GenerateThemeResults} globalStyles Global styles for the coreElements.
 */

/**
 * Generates a set of coreElements based on React supported HTML tags.
 *
 * @param {CreateCoreElementProps} props Properties to create coreElements with.
 * @return {import('./polymorphic-component').CoreElements} A set of coreElements.
 */
export function createCoreElements( { baseStyles, compiler, globalStyles } ) {
	/** @type {import('./polymorphic-component').CoreElements} */
	// @ts-ignore We fill in the missing properties in the loop below
	const core = {};

	const _createStyledElement = (
		/** @type {keyof JSX.IntrinsicElements} */ tagName
	) => createCoreElement( tagName, { baseStyles, compiler, globalStyles } );

	for ( const tagName of tags ) {
		core[ tagName ] = _createStyledElement( tagName );
	}

	return core;
}
