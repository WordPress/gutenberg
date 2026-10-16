import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePatternCategories from '../use-pattern-categories';

const mocks = vi.hoisted( () => ( {
	defaultCategories: [],
	themePatterns: [],
	userPatternCategories: [],
	userPatterns: [],
} ) );

vi.mock( import( '../use-default-pattern-categories' ), () => ( {
	default: () => [ ...mocks.defaultCategories ],
} ) );

vi.mock( import( '../use-theme-patterns' ), () => ( {
	default: () => [ ...mocks.themePatterns ],
} ) );

vi.mock( import( '../../page-patterns/use-patterns' ), () => ( {
	default: () => ( {
		patterns: [ ...mocks.userPatterns ],
		categories: [ ...mocks.userPatternCategories ],
	} ),
} ) );

beforeEach( () => {
	mocks.defaultCategories = [];
	mocks.themePatterns = [];
	mocks.userPatternCategories = [];
	mocks.userPatterns = [];
} );

function getPatternCategories() {
	return renderHook( () => usePatternCategories() ).result.current
		.patternCategories;
}

describe( 'usePatternCategories', () => {
	it( 'keeps user-created categories that contain no patterns', () => {
		mocks.userPatternCategories = [
			{
				id: 12,
				name: 'empty-category',
				slug: 'empty-category',
				label: 'Empty Category',
			},
		];

		const patternCategories = getPatternCategories();
		const emptyCategory = patternCategories.find(
			( category ) => category.name === 'empty-category'
		);

		expect( emptyCategory ).toBeDefined();
		expect( emptyCategory.count ).toBe( 0 );
	} );

	it( 'still omits theme-registered categories that contain no patterns', () => {
		mocks.defaultCategories = [
			{ name: 'theme-category', label: 'Theme Category' },
		];

		const patternCategories = getPatternCategories();

		expect(
			patternCategories.find(
				( category ) => category.name === 'theme-category'
			)
		).toBeUndefined();
	} );

	it( 'counts the patterns still assigned to a category', () => {
		mocks.userPatternCategories = [
			{
				id: 12,
				name: 'kept-category',
				slug: 'kept-category',
				label: 'Kept Category',
			},
		];
		mocks.userPatterns = [ { id: 1, wp_pattern_category: [ 12 ] } ];

		const patternCategories = getPatternCategories();
		const keptCategory = patternCategories.find(
			( category ) => category.name === 'kept-category'
		);

		expect( keptCategory ).toBeDefined();
		expect( keptCategory.count ).toBe( 1 );
	} );
} );
