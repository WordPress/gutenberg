import { describe, expect, it } from 'vitest';
import {
	getPopulatedCategories,
	isPatternFiltered,
	INSERTER_PATTERN_TYPES,
} from '../utils';

const registeredCategories = [
	{ name: 'banner', label: 'Banners' },
	{ name: 'text', label: 'Text' },
];

const themePattern = {
	name: 'active-theme/hero',
	categories: [ 'banner' ],
};

function installedThemePattern( name, categories ) {
	return {
		name,
		categories,
		type: INSERTER_PATTERN_TYPES.installedTheme,
	};
}

function getCategoryNames( patterns ) {
	return getPopulatedCategories( patterns, registeredCategories ).map(
		( { name } ) => name
	);
}

describe( 'getPopulatedCategories', () => {
	it( 'adds "Other categories" when a pattern from another theme only uses categories that are not registered', () => {
		expect(
			getCategoryNames( [
				themePattern,
				installedThemePattern( 'other-theme/page', [
					'other-theme_page',
				] ),
			] )
		).toEqual( [ 'banner', 'otherCategories' ] );
	} );

	it( 'keeps a pattern from another theme in its registered category', () => {
		expect(
			getCategoryNames( [
				installedThemePattern( 'other-theme/hero', [
					'banner',
					'other-theme_page',
				] ),
			] )
		).toEqual( [ 'banner' ] );
	} );

	it( 'puts a pattern from another theme without categories in "Uncategorized"', () => {
		expect(
			getCategoryNames( [
				installedThemePattern( 'other-theme/quote', undefined ),
			] )
		).toEqual( [ 'uncategorized' ] );
	} );

	it( 'does not add "Uncategorized" for patterns in "Other categories"', () => {
		expect(
			getCategoryNames( [
				installedThemePattern( 'other-theme/page', [
					'other-theme_page',
				] ),
			] )
		).toEqual( [ 'otherCategories' ] );
	} );
} );

describe( 'isPatternFiltered', () => {
	const otherThemePattern = installedThemePattern( 'other-theme/hero', [
		'banner',
	] );

	it( 'shows only patterns from other themes when the "Other themes" source is selected', () => {
		expect(
			isPatternFiltered(
				otherThemePattern,
				INSERTER_PATTERN_TYPES.installedTheme
			)
		).toBe( false );
		expect(
			isPatternFiltered(
				themePattern,
				INSERTER_PATTERN_TYPES.installedTheme
			)
		).toBe( true );
	} );

	it( 'hides patterns from other themes when another source is selected', () => {
		expect(
			isPatternFiltered( otherThemePattern, INSERTER_PATTERN_TYPES.theme )
		).toBe( true );
		expect(
			isPatternFiltered(
				otherThemePattern,
				INSERTER_PATTERN_TYPES.directory
			)
		).toBe( true );
		expect(
			isPatternFiltered( otherThemePattern, INSERTER_PATTERN_TYPES.user )
		).toBe( true );
	} );
} );
