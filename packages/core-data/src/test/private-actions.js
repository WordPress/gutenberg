/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { editMediaEntity, createStagedEntityRecord } from '../private-actions';
import { STAGED_ID_PREFIX } from '../utils';

jest.mock( '@wordpress/api-fetch' );

describe( 'editMediaEntity', () => {
	let dispatch;
	let resolveSelect;

	beforeEach( () => {
		apiFetch.mockReset();
		dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn( () => 'test-lock' ),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		resolveSelect = {
			getEntitiesConfig: jest.fn( () => [
				{
					kind: 'postType',
					name: 'attachment',
					baseURL: '/wp/v2/media',
				},
			] ),
		};
	} );

	it( 'should return early when recordId is not provided', async () => {
		const result = await editMediaEntity( null )( {
			dispatch,
			resolveSelect,
		} );

		expect( result ).toBeUndefined();
		expect( dispatch.__unstableAcquireStoreLock ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should return early when entity config is not found', async () => {
		resolveSelect.getEntitiesConfig.mockReturnValue( [] );

		const result = await editMediaEntity( 123 )( {
			dispatch,
			resolveSelect,
		} );

		expect( result ).toBeUndefined();
		expect( dispatch.__unstableAcquireStoreLock ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should successfully edit a media entity', async () => {
		const recordId = 123;
		const edits = {
			src: 'https://example.com/image.jpg',
			modifiers: [
				{ type: 'resize', args: { width: 300, height: 200 } },
			],
		};
		const updatedRecord = {
			id: recordId,
			src: 'https://example.com/image.jpg',
			modified: true,
		};

		apiFetch.mockResolvedValue( updatedRecord );

		const result = await editMediaEntity(
			recordId,
			edits
		)( {
			dispatch,
			resolveSelect,
		} );

		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledWith(
			'core',
			[ 'entities', 'records', 'postType', 'attachment', recordId ],
			{ exclusive: true }
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'attachment',
			recordId,
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/edit',
			method: 'POST',
			data: edits,
		} );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			[ updatedRecord ],
			undefined,
			true,
			undefined,
			undefined
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'attachment',
			recordId,
			error: undefined,
		} );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);

		expect( result ).toBe( updatedRecord );
	} );

	it( 'should handle API errors when throwOnError is false', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const apiError = new Error( 'API error' );

		apiFetch.mockRejectedValue( apiError );

		const result = await editMediaEntity( recordId, edits, {
			throwOnError: false,
		} )( { dispatch, resolveSelect } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'attachment',
			recordId,
		} );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'attachment',
			recordId,
			error: apiError,
		} );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);

		expect( result ).toBeUndefined();
	} );

	it( 'should throw errors when throwOnError is true', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const apiError = new Error( 'API error' );

		apiFetch.mockRejectedValue( apiError );

		await expect(
			editMediaEntity( recordId, edits, { throwOnError: true } )( {
				dispatch,
				resolveSelect,
			} )
		).rejects.toEqual( apiError );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);
	} );

	it( 'should use custom fetch function when provided', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const customFetch = jest.fn().mockResolvedValue( { id: recordId } );

		await editMediaEntity( recordId, edits, {
			__unstableFetch: customFetch,
		} )( { dispatch, resolveSelect } );

		expect( customFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/edit',
			method: 'POST',
			data: edits,
		} );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should handle null response from API', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };

		apiFetch.mockResolvedValue( null );

		const result = await editMediaEntity(
			recordId,
			edits
		)( {
			dispatch,
			resolveSelect,
		} );

		expect( dispatch.receiveEntityRecords ).not.toHaveBeenCalled();
		expect( result ).toBeUndefined();
	} );
} );

describe( 'createStagedEntityRecord', () => {
	let dispatch;
	let select;
	let resolveSelect;

	beforeEach( () => {
		dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
		} );
		select = {
			getEntitiesConfig: jest.fn( () => [
				{
					kind: 'postType',
					name: 'post',
					key: 'id',
				},
			] ),
		};
		resolveSelect = {};
	} );

	it( 'should throw when the entity does not have a loaded config', async () => {
		select.getEntitiesConfig.mockReturnValue( [] );

		await expect(
			createStagedEntityRecord( 'postType', 'unknownEntity', {
				title: 'Test',
			} )( { select, dispatch, resolveSelect } )
		).rejects.toThrow(
			'The entity being created (postType, unknownEntity) does not have a loaded config.'
		);
	} );

	it( 'should create a local-only entity record with a staged ID', async () => {
		const record = { title: 'New Post', status: 'draft' };

		const result = await createStagedEntityRecord(
			'postType',
			'post',
			record
		)( { select, dispatch, resolveSelect } );

		// Verify the result has a staged ID
		expect( result.id ).toBeDefined();
		expect( result.id.startsWith( STAGED_ID_PREFIX ) ).toBe( true );

		// Verify the original record properties are preserved
		expect( result.title ).toBe( 'New Post' );
		expect( result.status ).toBe( 'draft' );

		// Verify receiveEntityRecords was called
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			expect.objectContaining( {
				title: 'New Post',
				status: 'draft',
			} ),
			undefined
		);
	} );

	it( 'should use the entity key from config', async () => {
		select.getEntitiesConfig.mockReturnValue( [
			{
				kind: 'root',
				name: 'menuLocation',
				key: 'name',
			},
		] );

		const record = { menu: 0 };

		const result = await createStagedEntityRecord(
			'root',
			'menuLocation',
			record
		)( { select, dispatch, resolveSelect } );

		// Verify the result uses the custom key
		expect( result.name ).toBeDefined();
		expect( result.name.startsWith( STAGED_ID_PREFIX ) ).toBe( true );
		expect( result.menu ).toBe( 0 );
	} );

	it( 'should generate unique staged IDs for each call', async () => {
		const record = { title: 'Test' };

		const result1 = await createStagedEntityRecord(
			'postType',
			'post',
			record
		)( { select, dispatch, resolveSelect } );

		const result2 = await createStagedEntityRecord(
			'postType',
			'post',
			record
		)( { select, dispatch, resolveSelect } );

		expect( result1.id ).not.toBe( result2.id );
	} );
} );
