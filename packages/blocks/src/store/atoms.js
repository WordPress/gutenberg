/**
 * WordPress dependencies
 */
import { createAtom } from '@wordpress/stan';
import { __ } from '@wordpress/i18n';

/**
 * @typedef {Object} WPBlockCategory
 *
 * @property {string} slug  Unique category slug.
 * @property {string} title Category label, for display in user interface.
 */

/**
 * Default set of categories.
 *
 * @type {WPBlockCategory[]}
 */
export const DEFAULT_CATEGORIES = [
	{ slug: 'text', title: __( 'Text' ) },
	{ slug: 'media', title: __( 'Media' ) },
	{ slug: 'design', title: __( 'Design' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'reusable', title: __( 'Reusable blocks' ) },
];

export const defaultBlockName = createAtom( null, {
	id: 'Default block name',
} );
export const freeformFallbackBlockName = createAtom( null, {
	id: 'freeform fallback block name',
} );
export const unregisteredFallbackBlockName = createAtom( null, {
	id: 'unregistered fallback block name',
} );
export const groupingBlockName = createAtom( null, {
	id: 'grouping block name',
} );
export const blockTypesByName = createAtom( {}, { id: 'block types by name' } );
export const blockStylesByBlockName = createAtom(
	{},
	{ id: 'block styles by block name' }
);
export const blockVariationsByBlockName = createAtom(
	{},
	{ id: 'block variations by block name' }
);
export const blockCategories = createAtom( DEFAULT_CATEGORIES, {
	id: 'block categories',
} );
export const blockCollections = createAtom( {}, { id: 'block collections' } );

export const rootAtoms = [
	blockTypesByName,
	blockStylesByBlockName,
	blockVariationsByBlockName,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	groupingBlockName,
	blockCategories,
	blockCollections,
];
