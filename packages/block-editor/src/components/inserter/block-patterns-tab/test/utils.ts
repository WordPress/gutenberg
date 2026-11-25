import { describe, expect, it } from 'vitest';
import {
	allPatternsCategory,
	getCategoriesBySource,
	isPatternInSource,
	sitePatternsCategory,
	INSERTER_PATTERN_TYPES,
	INSERTER_SYNC_TYPES,
	MY_PATTERNS_SOURCE,
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
	syncStatus: 'unsynced',
} );
// A pattern the current user made on the site, synced.
const myPattern = pattern( {
	name: 'core/block/13',
	type: INSERTER_PATTERN_TYPES.user,
	source: 'user',
	categories: [ 'gallery' ],
	syncStatus: '',
	isCurrentUserPattern: true,
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

	it( 'offers the sources in a fixed order, from the farthest to the closest', () => {
		const categoriesBySource = getCategoriesBySource(
			[ myPattern, sitePattern, themeHero, directoryGallery ],
			categories
		);

		expect( [ ...categoriesBySource.keys() ] ).toEqual( [
			INSERTER_PATTERN_TYPES.directory,
			INSERTER_PATTERN_TYPES.theme,
			INSERTER_PATTERN_TYPES.user,
			MY_PATTERNS_SOURCE,
		] );
	} );

	it( 'offers the patterns of the current user while they are some of the patterns of the site', () => {
		const categoriesBySource = getCategoriesBySource(
			[ sitePattern, myPattern ],
			categories
		);

		expect(
			names( categoriesBySource.get( INSERTER_PATTERN_TYPES.user ) )
		).toEqual( [ 'banner', 'gallery' ] );
		expect( names( categoriesBySource.get( MY_PATTERNS_SOURCE ) ) ).toEqual(
			[ 'gallery' ]
		);
	} );

	it( 'leaves out the patterns of the current user when they are all the patterns of the site', () => {
		const categoriesBySource = getCategoriesBySource(
			[ themeHero, myPattern ],
			categories
		);

		expect( [ ...categoriesBySource.keys() ] ).toEqual( [
			INSERTER_PATTERN_TYPES.theme,
			INSERTER_PATTERN_TYPES.user,
		] );
	} );

	it( 'leaves out the patterns of the current user when there are none, or the user is not known', () => {
		const categoriesBySource = getCategoriesBySource(
			[ themeHero, sitePattern ],
			categories
		);

		expect( [ ...categoriesBySource.keys() ] ).toEqual( [
			INSERTER_PATTERN_TYPES.theme,
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

describe( 'isPatternInSource', () => {
	it( 'keeps each pattern in the source it comes from', () => {
		const inSource = ( source: string ) =>
			[
				themeHero,
				pluginPricing,
				directoryGallery,
				sitePattern,
				myPattern,
			]
				.filter( ( item ) => isPatternInSource( item, source ) )
				.map( ( { name } ) => name );

		expect( inSource( INSERTER_PATTERN_TYPES.directory ) ).toEqual( [
			'core/gallery',
		] );
		expect( inSource( INSERTER_PATTERN_TYPES.theme ) ).toEqual( [
			'theme/hero',
			'my-plugin/pricing',
		] );
		expect( inSource( INSERTER_PATTERN_TYPES.user ) ).toEqual( [
			'core/block/12',
			'core/block/13',
		] );
	} );

	it( 'keeps only the patterns the current user made', () => {
		expect( isPatternInSource( myPattern, MY_PATTERNS_SOURCE ) ).toBe(
			true
		);
		expect( isPatternInSource( sitePattern, MY_PATTERNS_SOURCE ) ).toBe(
			false
		);
		expect( isPatternInSource( themeHero, MY_PATTERNS_SOURCE ) ).toBe(
			false
		);
	} );

	it( 'narrows the patterns of the site down to the synced or the not synced ones', () => {
		expect(
			isPatternInSource(
				myPattern,
				MY_PATTERNS_SOURCE,
				INSERTER_SYNC_TYPES.full
			)
		).toBe( true );
		expect(
			isPatternInSource(
				myPattern,
				MY_PATTERNS_SOURCE,
				INSERTER_SYNC_TYPES.unsynced
			)
		).toBe( false );
		expect(
			isPatternInSource(
				sitePattern,
				INSERTER_PATTERN_TYPES.user,
				INSERTER_SYNC_TYPES.unsynced
			)
		).toBe( true );
	} );
} );
