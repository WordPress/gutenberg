import { describe, expect, it } from 'vitest';
import {
	allPatternsCategory,
	getPatternSourceType,
	isPatternFiltered,
	isPatternInCategory,
	sitePatternsCategory,
	starterPatternsCategory,
	INSERTER_PATTERN_TYPES,
} from '../utils';

const userPattern = {
	name: 'core/block/1',
	type: INSERTER_PATTERN_TYPES.user,
	content: '',
};
const bundledCorePattern = {
	name: 'core/query-standard-posts',
	source: 'core',
	content: '',
};
const remotePattern = {
	name: 'core/remote',
	source: 'pattern-directory/featured',
	content: '',
};
const themePattern = {
	name: 'theme/hero',
	source: 'theme',
	content: '',
};

describe( 'getPatternSourceType', () => {
	it( 'returns the source each pattern is filtered under', () => {
		expect( getPatternSourceType( userPattern ) ).toBe(
			INSERTER_PATTERN_TYPES.user
		);
		expect( getPatternSourceType( bundledCorePattern ) ).toBe(
			INSERTER_PATTERN_TYPES.directory
		);
		expect( getPatternSourceType( remotePattern ) ).toBe(
			INSERTER_PATTERN_TYPES.directory
		);
		expect( getPatternSourceType( themePattern ) ).toBe(
			INSERTER_PATTERN_TYPES.theme
		);
	} );
} );

describe( 'isPatternFiltered', () => {
	const patterns = [
		userPattern,
		bundledCorePattern,
		remotePattern,
		themePattern,
	];
	const visible = ( sourceFilter: string ) =>
		patterns
			.filter(
				( pattern ) => ! isPatternFiltered( pattern, sourceFilter )
			)
			.map( ( { name } ) => name );

	it( 'keeps only the patterns of the selected source', () => {
		expect( visible( 'all' ) ).toEqual( [
			'core/block/1',
			'core/query-standard-posts',
			'core/remote',
			'theme/hero',
		] );
		expect( visible( INSERTER_PATTERN_TYPES.user ) ).toEqual( [
			'core/block/1',
		] );
		expect( visible( INSERTER_PATTERN_TYPES.directory ) ).toEqual( [
			'core/query-standard-posts',
			'core/remote',
		] );
		expect( visible( INSERTER_PATTERN_TYPES.theme ) ).toEqual( [
			'theme/hero',
		] );
	} );
} );

describe( 'isPatternInCategory', () => {
	const allCategories = [ { name: 'banner', label: 'Banners' } ];
	const bannerPattern = { ...themePattern, categories: [ 'banner' ] };
	const unregisteredCategoryPattern = {
		...userPattern,
		categories: [ 'my-category' ],
	};
	const starterPattern = {
		...themePattern,
		blockTypes: [ 'core/post-content' ],
	};
	const inCategory = ( categoryName: string ) =>
		[
			bannerPattern,
			unregisteredCategoryPattern,
			starterPattern,
			bundledCorePattern,
		].filter( ( pattern ) =>
			isPatternInCategory( pattern, categoryName, allCategories )
		);

	it( 'puts the patterns without a registered category in uncategorized', () => {
		expect( inCategory( 'uncategorized' ) ).toEqual( [
			unregisteredCategoryPattern,
			starterPattern,
			bundledCorePattern,
		] );
	} );

	it( 'matches the special and registered categories', () => {
		expect( inCategory( allPatternsCategory.name ) ).toHaveLength( 4 );
		expect( inCategory( sitePatternsCategory.name ) ).toEqual( [
			unregisteredCategoryPattern,
		] );
		expect( inCategory( starterPatternsCategory.name ) ).toEqual( [
			starterPattern,
		] );
		expect( inCategory( 'banner' ) ).toEqual( [ bannerPattern ] );
	} );
} );
