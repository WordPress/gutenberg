import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataRegistry } from '@wordpress/data';
import { mediaUpload, heicMediaUpload } from '../';
import type { MediaUploadFunction } from '../types';

const mockIsHeicFile = vi.fn< ( file: File ) => Promise< boolean > >();

vi.mock( '@wordpress/upload-media', async ( importOriginal ) => {
	const actual =
		await importOriginal< typeof import( '@wordpress/upload-media' ) >();
	return {
		...actual,
		isHeicFile: ( file: File ) => mockIsHeicFile( file ),
	};
} );

type AddItemsPayload = {
	files: File[];
	onChange?: ( attachments: Array< Record< string, unknown > > ) => void;
	onSuccess?: ( attachments: Array< Record< string, unknown > > ) => void;
	onBatchSuccess?: () => void;
	onError?: ( error: unknown ) => void;
};

function createFile( name: string, type = 'image/jpeg' ): File {
	return new File( [ 'data' ], name, { type } );
}

function createMockRegistry() {
	const addItemsCalls: AddItemsPayload[] = [];
	const mockAddItems = vi.fn( ( payload: AddItemsPayload ) => {
		addItemsCalls.push( payload );
	} );
	const registry = {
		dispatch: vi.fn( () => ( {
			addItems: mockAddItems,
		} ) ),
	} as unknown as DataRegistry;

	return {
		registry,
		addItemsCalls,
	};
}

describe( 'mediaUpload batch handling', () => {
	beforeEach( () => {
		mockIsHeicFile.mockReset();
		mockIsHeicFile.mockResolvedValue( false );
	} );

	it( 'passes all active files in original order to onFileChange even when uploads update out of order', () => {
		const { registry, addItemsCalls } = createMockRegistry();
		const onFileChange = vi.fn();
		const onBatchSuccess = vi.fn();

		const file1 = createFile( 'one.jpg' );
		const file2 = createFile( 'two.jpg' );
		const file3 = createFile( 'three.jpg' );

		mediaUpload(
			registry,
			{},
			{
				filesList: [ file1, file2, file3 ],
				onFileChange,
				onBatchSuccess,
			}
		);

		expect( addItemsCalls ).toHaveLength( 3 );
		expect( addItemsCalls.map( ( c ) => c.files ) ).toEqual( [
			[ file1 ],
			[ file2 ],
			[ file3 ],
		] );

		const att1 = { id: 1, url: 'https://example.com/1.jpg' };
		const att2 = { id: 2, url: 'https://example.com/2.jpg' };
		const att3 = { id: 3, url: 'https://example.com/3.jpg' };

		addItemsCalls[ 1 ].onChange?.( [ att2 ] );
		expect( onFileChange ).toHaveBeenLastCalledWith( [ att2 ] );

		addItemsCalls[ 0 ].onChange?.( [ att1 ] );
		expect( onFileChange ).toHaveBeenLastCalledWith( [ att1, att2 ] );

		addItemsCalls[ 2 ].onChange?.( [ att3 ] );
		expect( onFileChange ).toHaveBeenLastCalledWith( [ att1, att2, att3 ] );

		addItemsCalls[ 1 ].onBatchSuccess?.();
		addItemsCalls[ 0 ].onBatchSuccess?.();
		expect( onBatchSuccess ).not.toHaveBeenCalled();

		addItemsCalls[ 2 ].onBatchSuccess?.();
		expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'clears failed file slot and calls onFileChange with remaining attachments', () => {
		const { registry, addItemsCalls } = createMockRegistry();
		const onFileChange = vi.fn();
		const onError = vi.fn();
		const onBatchSuccess = vi.fn();

		mediaUpload(
			registry,
			{},
			{
				filesList: [
					createFile( 'one.jpg' ),
					createFile( 'two.jpg' ),
					createFile( 'three.jpg' ),
				],
				onFileChange,
				onError,
				onBatchSuccess,
			}
		);

		const att1 = { id: 1, url: 'blob:1' };
		const att2 = { id: 2, url: 'blob:2' };
		const att3 = { id: 3, url: 'blob:3' };

		addItemsCalls[ 0 ].onChange?.( [ att1 ] );
		addItemsCalls[ 1 ].onChange?.( [ att2 ] );
		addItemsCalls[ 2 ].onChange?.( [ att3 ] );

		addItemsCalls[ 1 ].onError?.( new Error( 'Upload failed' ) );
		expect( onError ).toHaveBeenCalledWith( 'Upload failed' );
		expect( onFileChange ).toHaveBeenLastCalledWith( [ att1, att3 ] );

		addItemsCalls[ 0 ].onBatchSuccess?.();
		addItemsCalls[ 2 ].onBatchSuccess?.();
		expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not fire onBatchSuccess when all files in a batch fail', () => {
		const { registry, addItemsCalls } = createMockRegistry();
		const onError = vi.fn();
		const onBatchSuccess = vi.fn();

		mediaUpload(
			registry,
			{},
			{
				filesList: [ createFile( 'one.jpg' ), createFile( 'two.jpg' ) ],
				onError,
				onBatchSuccess,
			}
		);

		addItemsCalls[ 0 ].onError?.( 'First failed' );
		addItemsCalls[ 1 ].onError?.( 'Second failed' );

		expect( onError ).toHaveBeenCalledTimes( 2 );
		expect( onBatchSuccess ).not.toHaveBeenCalled();
	} );

	it( 'rejects multiple files when multiple is false', () => {
		const { registry, addItemsCalls } = createMockRegistry();
		const onError = vi.fn();

		mediaUpload(
			registry,
			{},
			{
				filesList: [ createFile( 'one.jpg' ), createFile( 'two.jpg' ) ],
				multiple: false,
				onError,
			}
		);

		expect( onError ).toHaveBeenCalledWith(
			'Only one file can be used here.'
		);
		expect( addItemsCalls ).toHaveLength( 0 );
	} );

	it( 'preserves file order and coordinates onBatchSuccess across HEIC and non-HEIC files', async () => {
		const { registry, addItemsCalls } = createMockRegistry();
		const originalMediaUploadCalls: Array< {
			filesList: ArrayLike< File >;
			onFileChange?: (
				attachments: Array< Record< string, unknown > >
			) => void;
			onSuccess?: (
				attachments: Array< Record< string, unknown > >
			) => void;
			onError?: ( message: string ) => void;
			onBatchSuccess?: () => void;
		} > = [];
		const originalMediaUpload = vi.fn( ( opts ) => {
			originalMediaUploadCalls.push( opts );
		} ) as unknown as MediaUploadFunction;

		mockIsHeicFile.mockImplementation( async ( file ) =>
			file.name.endsWith( '.heic' )
		);

		const heic1 = createFile( 'first.heic', 'image/heic' );
		const jpg1 = createFile( 'second.jpg', 'image/jpeg' );
		const heic2 = createFile( 'third.heic', 'image/heic' );

		const onFileChange = vi.fn();
		const onBatchSuccess = vi.fn();

		await heicMediaUpload(
			registry,
			{ mediaUpload: originalMediaUpload },
			{
				filesList: [ heic1, jpg1, heic2 ],
				onFileChange,
				onBatchSuccess,
			}
		);

		expect( addItemsCalls ).toHaveLength( 2 );
		expect( originalMediaUploadCalls ).toHaveLength( 1 );

		const attHeic1 = { id: 1, url: 'https://example.com/1.jpg' };
		const attJpg1 = { id: 2, url: 'https://example.com/2.jpg' };
		const attHeic2 = { id: 3, url: 'https://example.com/3.jpg' };

		originalMediaUploadCalls[ 0 ].onFileChange?.( [ attJpg1 ] );
		expect( onFileChange ).toHaveBeenLastCalledWith( [ attJpg1 ] );

		addItemsCalls[ 1 ].onChange?.( [ attHeic2 ] );
		expect( onFileChange ).toHaveBeenLastCalledWith( [
			attJpg1,
			attHeic2,
		] );

		addItemsCalls[ 0 ].onChange?.( [ attHeic1 ] );
		expect( onFileChange ).toHaveBeenLastCalledWith( [
			attHeic1,
			attJpg1,
			attHeic2,
		] );

		originalMediaUploadCalls[ 0 ].onSuccess?.( [ attJpg1 ] );
		addItemsCalls[ 0 ].onBatchSuccess?.();
		expect( onBatchSuccess ).not.toHaveBeenCalled();

		addItemsCalls[ 1 ].onBatchSuccess?.();
		expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
	} );
} );
