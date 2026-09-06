import { act, renderHook } from '@testing-library/react';
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
						description: 'My Tagline',
						site_logo: 123,
						site_icon: 456,
					} ),
					getEntityConfig: jest.fn().mockReturnValue( {
						meta: {
							labels: {
								title: 'Site Title',
								description: 'Site Tagline',
								site_logo: 'Site Logo',
								site_icon: 'Site Icon',
							},
						},
					} ),
				};
			};
			return fn( select );
		} ),
	};
} );

describe( 'useIsDirty', () => {
	it( 'should calculate dirtyEntityRecords in the expected order', () => {
		const { result } = renderHook( () => useIsDirty() );
		expect( result.current.dirtyEntityRecords ).toEqual( [
			{
				kind: 'postType',
				name: 'post',
				property: 'property',
				title: 'title',
			},
			{
				kind: 'root',
				name: 'site',
				property: 'title',
				title: 'Site Title',
			},
			{
				kind: 'root',
				name: 'site',
				property: 'description',
				title: 'Site Tagline',
			},
			{
				kind: 'root',
				name: 'site',
				property: 'site_logo',
				title: 'Site Logo',
			},
			{
				kind: 'root',
				name: 'site',
				property: 'site_icon',
				title: 'Site Icon',
			},
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
					property: 'title',
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
					property: 'description',
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
					property: 'site_logo',
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
					property: 'site_icon',
				},
				false
			);
		} );
		expect( result.current.isDirty ).toBeFalsy();
	} );
} );
