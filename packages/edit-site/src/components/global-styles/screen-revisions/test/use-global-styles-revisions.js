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
import useGlobalStylesRevisions from '../use-global-styles-revisions';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

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

describe( 'useGlobalStylesRevisions', () => {
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
		isLoadingGlobalStylesRevisions: false,
		revisionsCount: 1,
	};

	it( 'returns loaded revisions with no unsaved changes', () => {
		useSelect.mockImplementation( () => selectValue );

		const { result } = renderHook( () => useGlobalStylesRevisions() );
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
			{
				id: 'parent',
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

		const { result } = renderHook( () => useGlobalStylesRevisions() );
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
			{
				id: 'parent',
				settings: {},
				styles: {},
			},
		] );
	} );

	it( 'returns empty revisions', () => {
		useSelect.mockImplementation( () => ( {
			...selectValue,
			revisions: [],
		} ) );

		const { result } = renderHook( () => useGlobalStylesRevisions() );
		const { revisions, isLoading, hasUnsavedChanges } = result.current;

		expect( isLoading ).toBe( false );
		expect( hasUnsavedChanges ).toBe( false );
		expect( revisions ).toEqual( [] );
	} );

	it( 'returns loading status when resolving global revisions', () => {
		useSelect.mockImplementation( () => ( {
			...selectValue,
			isLoadingGlobalStylesRevisions: true,
		} ) );

		const { result } = renderHook( () => useGlobalStylesRevisions() );
		const { isLoading } = result.current;

		expect( isLoading ).toBe( true );
	} );

	it( 'returns empty revisions when authors are not yet available', () => {
		useSelect.mockImplementation( () => ( {
			...selectValue,
			authors: [],
		} ) );

		const { result } = renderHook( () => useGlobalStylesRevisions() );
		const { revisions, isLoading, hasUnsavedChanges } = result.current;

		expect( isLoading ).toBe( true );
		expect( hasUnsavedChanges ).toBe( false );
		expect( revisions ).toEqual( [] );
	} );

	it( 'should prepend unsaved changes item and append reset item to paginated results', () => {
		useSelect.mockImplementation( () => ( {
			...selectValue,
			revisionsCount: 2,
			isDirty: true,
		} ) );

		// Prepend unsaved changes item to paginated results.
		const { result: resultPrepend } = renderHook( () =>
			useGlobalStylesRevisions( {
				query: {
					per_page: 1,
					page: 1,
				},
			} )
		);
		expect( resultPrepend.current.revisions ).toEqual( [
			{
				author: {
					avatar_urls: {},
					name: 'fred',
				},
				id: 'unsaved',
				modified: resultPrepend.current.revisions[ 0 ].modified,
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

		// Append reset item to paginated results.
		const { result: resultAppend } = renderHook( () =>
			useGlobalStylesRevisions( {
				query: {
					per_page: 1,
					page: 2,
				},
			} )
		);
		expect( resultAppend.current.revisions ).toEqual( [
			{
				author: {
					id: 4,
					name: 'sam',
				},
				id: 1,
				settings: {},
				styles: {},
			},
			{
				id: 'parent',
				settings: {},
				styles: {},
			},
		] );
	} );
} );
