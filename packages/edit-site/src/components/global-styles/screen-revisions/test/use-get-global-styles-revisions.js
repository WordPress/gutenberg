/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useGetGlobalStylesRevisions from '../use-get-global-styles-revisions';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/element', () => {
	return {
		__esModule: true,
		...jest.requireActual( '@wordpress/element' ),
		useContext: jest.fn().mockImplementation( () => ( {
			user: {
				styles: 'ice-cream',
				settings: 'cake',
			},
		} ) ),
	};
} );

describe( 'useGetGlobalStylesRevisions', () => {
	const selectValue = {
		authors: [
			{
				id: 4,
				name: 'sam',
			},
		],
		currentUser: {
			name: 'fred',
			avatar_urls: {},
		},
		isDirty: false,
		revisions: [
			{
				id: 1,
				author: 4,
				settings: {},
				styles: {},
			},
		],
		isLoading: false,
	};

	it( 'returns loaded revisions with no unsaved changes', () => {
		useSelect.mockImplementation( () => selectValue );

		const { result } = renderHook( () => useGetGlobalStylesRevisions() );
		const { revisions, isLoading, hasUnsavedChanges } = result.current;

		expect( isLoading ).toBe( false );
		expect( hasUnsavedChanges ).toBe( false );
		expect( revisions ).toEqual( [
			{
				author: {
					id: 4,
					name: 'sam',
				},
				id: 1,
				isLatest: true,
				settings: {},
				styles: {},
			},
		] );
	} );

	it( 'returns loaded revisions with saved changes', () => {
		useSelect.mockImplementation( () => ( {
			...selectValue,
			isDirty: true,
		} ) );

		const { result } = renderHook( () => useGetGlobalStylesRevisions() );
		const { revisions, isLoading, hasUnsavedChanges } = result.current;

		expect( isLoading ).toBe( false );
		expect( hasUnsavedChanges ).toBe( true );
		expect( revisions ).toEqual( [
			{
				author: {
					avatar_urls: {},
					name: 'fred',
				},
				id: 'unsaved',
				modified: revisions[ 0 ].modified,
				settings: 'cake',
				styles: 'ice-cream',
			},
			{
				author: {
					id: 4,
					name: 'sam',
				},
				id: 1,
				isLatest: true,
				settings: {},
				styles: {},
			},
		] );
	} );

	it( 'returns empty revisions when still loading', () => {
		useSelect.mockImplementation( () => ( {
			...selectValue,
			isLoading: true,
		} ) );

		const { result } = renderHook( () => useGetGlobalStylesRevisions() );
		const { revisions, isLoading, hasUnsavedChanges } = result.current;

		expect( isLoading ).toBe( true );
		expect( hasUnsavedChanges ).toBe( false );
		expect( revisions ).toEqual( [] );
	} );
} );
