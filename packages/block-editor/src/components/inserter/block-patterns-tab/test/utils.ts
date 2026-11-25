import { describe, expect, it } from 'vitest';
import {
	allPatternsCategory,
	getCategoriesBySource,
	sitePatternsCategory,
	INSERTER_PATTERN_TYPES,
} from '../utils';
import type { BlockPattern } from '../../../../store/types';
import type { PatternCategory } from '../../types';

const pattern = ( props: Partial< BlockPattern > & { name: string } ) =>
	( { content: '', ...props } ) as BlockPattern;

// A theme, a plugin, the Pattern Directory and the site itself, each with a
// pattern of its own.
const themeHero = pattern( {
	name: 'theme/hero',
	source: 'theme',
	categories: [ 'banner' ],
} );
const pluginPricing = pattern( {
	name: 'my-plugin/pricing',
	source: 'plugin',
	categories: [ 'my-plugin' ],
} );
const directoryGallery = pattern( {
	name: 'core/gallery',
	source: 'pattern-directory/core',
	categories: [ 'gallery' ],
} );
const sitePattern = pattern( {
	name: 'core/block/12',
	type: INSERTER_PATTERN_TYPES.user,
	source: 'user',
	categories: [ 'banner' ],
} );

// What the inserter hands over: the categories with patterns, of any source.
const categories: PatternCategory[] = [
	allPatternsCategory,
	sitePatternsCategory,
	{ name: 'banner', label: 'Banners' },
	{ name: 'gallery', label: 'Gallery' },
	{ name: 'my-plugin', label: 'My plugin' },
];

const names = ( list: PatternCategory[] | undefined ) =>
	list?.map( ( { name } ) => name );

describe( 'getCategoriesBySource', () => {
	it( 'lists each category under the sources that have patterns in it', () => {
		const categoriesBySource = getCategoriesBySource(
			[ themeHero, pluginPricing, directoryGallery, sitePattern ],
			categories
		);

		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.theme ) )
		).toEqual( [ 'banner', 'my-plugin' ] );
		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.directory ) )
		).toEqual( [ 'gallery' ] );
		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.user ) )
		).toEqual( [ 'banner' ] );
	} );

	it( 'offers the sources in a fixed order, the default one first', () => {
		const categoriesBySource = getCategoriesBySource(
			[ sitePattern, directoryGallery, themeHero ],
			categories
		);

		expect( [ ...categoriesBySource.keys() ] ).toEqual( [
			INSERTER_PATTERN_TYPES.theme,
			INSERTER_PATTERN_TYPES.directory,
			INSERTER_PATTERN_TYPES.user,
		] );
	} );

	it( 'leaves out a source without patterns', () => {
		const categoriesBySource = getCategoriesBySource(
			[ directoryGallery, sitePattern ],
			categories
		);

		expect( [ ...categoriesBySource.keys() ] ).toEqual( [
			INSERTER_PATTERN_TYPES.directory,
			INSERTER_PATTERN_TYPES.user,
		] );
	} );

	it( 'keeps the category of a pattern that a plugin registers, under the theme and plugins source', () => {
		const categoriesBySource = getCategoriesBySource(
			[ pluginPricing ],
			categories
		);

		expect( [ ...categoriesBySource.keys() ] ).toEqual( [
			INSERTER_PATTERN_TYPES.theme,
		] );
		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.theme ) )
		).toEqual( [ 'my-plugin' ] );
	} );

	it( 'lists a pattern without a registered category under "Uncategorized"', () => {
		const categoriesBySource = getCategoriesBySource(
			[
				pattern( { name: 'theme/loose', source: 'theme' } ),
				sitePattern,
			],
			[ ...categories, { name: 'uncategorized', label: 'Uncategorized' } ]
		);

		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.theme ) )
		).toEqual( [ 'uncategorized' ] );
		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.user ) )
		).toEqual( [ 'banner' ] );
	} );
} );
