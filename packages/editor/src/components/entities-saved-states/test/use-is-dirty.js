/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useIsDirty } from '../hooks/use-is-dirty';

jest.mock( '@wordpress/data', () => {
	return {
		useSelect: jest.fn().mockImplementation( ( fn ) => {
			const select = () => {
				return {
					__experimentalGetDirtyEntityRecords: jest
						.fn()
						.mockReturnValue( [
							{
								kind: 'root',
								name: 'site',
								title: 'title',
								property: 'property',
							},
							{
								kind: 'postType',
								name: 'post',
								title: 'title',
								property: 'property',
							},
						] ),
					getEntityRecordEdits: jest.fn().mockReturnValue( {
						title: 'My Site',
					} ),
					getEntityConfig: jest.fn().mockReturnValue( {
						meta: { labels: { title: 'Title' } },
					} ),
				};
			};
			return fn( select );
		} ),
	};
} );

jest.mock( '@wordpress/core-data', () => {
	return {
		store: {
			__experimentalGetDirtyEntityRecords: jest.fn(),
			getEntityRecordEdits: jest.fn(),
		},
	};
} );

describe( 'useIsDirty', () => {
	it( 'should calculate dirtyEntityRecords', () => {
		const { result } = renderHook( () => useIsDirty() );
		expect( result.current.dirtyEntityRecords ).toEqual( [
			{
				kind: 'postType',
				name: 'post',
				property: 'property',
				title: 'title',
			},
			{ kind: 'root', name: 'site', property: 'title', title: 'Title' },
		] );
	} );
	it( 'should return `isDirty: true` when there are changes', () => {
		const { result } = renderHook( () => useIsDirty() );
		expect( result.current.isDirty ).toBeTruthy();
	} );
	it( 'should return `isDirty: false` when there are NO changes', async () => {
		const { result } = renderHook( () => useIsDirty() );
		act( () => {
			result.current.setUnselectedEntities(
				{
					kind: 'postType',
					name: 'post',
					key: 'key',
					property: 'property',
				},
				false
			);
		} );
		act( () => {
			result.current.setUnselectedEntities(
				{
					kind: 'root',
					name: 'site',
					key: 'key',
					property: 'property',
				},
				false
			);
		} );
		expect( result.current.isDirty ).toBeFalsy();
	} );
} );
