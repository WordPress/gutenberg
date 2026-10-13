import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { select as selectStore, useRegistry, useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { store as uploadStore } from '@wordpress/upload-media';
import { BlockEditorProvider } from '../';
import { store as blockEditorStore } from '../../../store';

vi.mock( import( '@wordpress/blob' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	createBlobURL: ( file ) => `blob:${ file.name }`,
	revokeBlobURL: () => {},
} ) );

vi.mock( import( '@wordpress/upload-media' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	detectClientSideMediaSupport: () => ( { supported: true } ),
} ) );

window.__clientSideMediaProcessing = true;

const serverUploads = new Map();

function serverMediaUpload( { filesList: [ file ], onFileChange, onError } ) {
	serverUploads.set( file.name, { onFileChange, onError } );
}

async function finishServerUpload( name ) {
	await waitFor( () => expect( serverUploads.has( name ) ).toBe( true ) );
	serverUploads
		.get( name )
		.onFileChange( [ { id: name, url: `https://example.com/${ name }` } ] );
}

async function failServerUpload( name ) {
	await waitFor( () => expect( serverUploads.has( name ) ).toBe( true ) );
	serverUploads.get( name ).onError( new Error( `${ name } was refused.` ) );
}

function createFiles( ...names ) {
	return names.map(
		( name ) => new File( [ name ], name, { type: 'text/plain' } )
	);
}

function setUpMediaUpload( onRegistry ) {
	let mediaUpload;
	const GetMediaUpload = () => {
		const registry = useRegistry();
		onRegistry?.( registry );
		mediaUpload = useSelect(
			( select ) => select( blockEditorStore ).getSettings().mediaUpload,
			[]
		);
		return null;
	};
	render(
		createElement(
			BlockEditorProvider,
			{ settings: { mediaUpload: serverMediaUpload } },
			createElement( GetMediaUpload )
		)
	);
	return mediaUpload;
}

describe( 'mediaUpload with client-side media processing', () => {
	it( 'reports the current upload in file order through onFilesChange', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFilesChange = vi.fn();
		const onFileChange = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'one.txt', 'two.txt', 'three.txt' ),
			onFileChange,
			onFilesChange,
		} );

		await finishServerUpload( 'three.txt' );
		await waitFor( () =>
			expect( onFilesChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { url: 'blob:one.txt' } ),
				expect.objectContaining( { url: 'blob:two.txt' } ),
				expect.objectContaining( { id: 'three.txt' } ),
			] )
		);

		await finishServerUpload( 'one.txt' );
		await waitFor( () =>
			expect( onFilesChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { id: 'one.txt' } ),
				expect.objectContaining( { url: 'blob:two.txt' } ),
				expect.objectContaining( { id: 'three.txt' } ),
			] )
		);

		await finishServerUpload( 'two.txt' );
		await waitFor( () =>
			expect( onFilesChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { id: 'one.txt' } ),
				expect.objectContaining( { id: 'two.txt' } ),
				expect.objectContaining( { id: 'three.txt' } ),
			] )
		);
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'keeps onFileChange as a one-file callback without opting in', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFileChange = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'legacy-one.txt', 'legacy-two.txt' ),
			onFileChange,
		} );

		await finishServerUpload( 'legacy-two.txt' );
		await waitFor( () =>
			expect( onFileChange ).toHaveBeenCalledWith( [
				expect.objectContaining( { id: 'legacy-two.txt' } ),
			] )
		);
		expect(
			onFileChange.mock.calls.every( ( [ files ] ) => files.length === 1 )
		).toBe( true );
		await finishServerUpload( 'legacy-one.txt' );
		await waitFor( () =>
			expect( selectStore( uploadStore ).getItems() ).toHaveLength( 0 )
		);
	} );

	it( 'falls back to onFileChange when an older queue ignores onBatchChange', () => {
		let registry;
		const mediaUpload = setUpMediaUpload( ( value ) => {
			registry = value;
		} );
		const originalDispatch = registry.dispatch.bind( registry );
		const oldAddItems = vi.fn( ( { files, onChange } ) => {
			files.forEach( ( file ) =>
				onChange( [ { url: `blob:${ file.name }` } ] )
			);
		} );
		const dispatchSpy = vi
			.spyOn( registry, 'dispatch' )
			.mockImplementation( ( store ) =>
				store === uploadStore
					? { addItems: oldAddItems }
					: originalDispatch( store )
			);
		const onFileChange = vi.fn();
		const onFilesChange = vi.fn();

		try {
			mediaUpload( {
				filesList: createFiles( 'old-one.txt', 'old-two.txt' ),
				onFileChange,
				onFilesChange,
			} );
		} finally {
			dispatchSpy.mockRestore();
		}

		expect( oldAddItems ).toHaveBeenCalledTimes( 1 );
		expect( oldAddItems ).toHaveBeenCalledWith(
			expect.objectContaining( {
				onBatchChange: expect.any( Function ),
				onChange: expect.any( Function ),
			} )
		);
		expect( onFileChange.mock.calls ).toEqual( [
			[ [ { url: 'blob:old-one.txt' } ] ],
			[ [ { url: 'blob:old-two.txt' } ] ],
		] );
		expect( onFilesChange ).not.toHaveBeenCalled();
	} );

	it( 'reports only files from the current upload when uploading again', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFilesChange = vi.fn();
		const onBatchSuccess = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'earlier.txt' ),
			onFilesChange,
			onBatchSuccess,
		} );

		await finishServerUpload( 'earlier.txt' );
		await waitFor( () =>
			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 )
		);
		onFilesChange.mockClear();

		mediaUpload( {
			filesList: createFiles( 'later.txt' ),
			onFilesChange,
		} );

		await waitFor( () =>
			expect( onFilesChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { url: 'blob:later.txt' } ),
			] )
		);

		await finishServerUpload( 'later.txt' );
		await waitFor( () =>
			expect( onFilesChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { id: 'later.txt' } ),
			] )
		);
	} );

	it( 'drops a failed file from the files it reports', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFilesChange = vi.fn();
		const onError = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'four.txt', 'five.txt', 'six.txt' ),
			onFilesChange,
			onError,
		} );

		await finishServerUpload( 'four.txt' );
		await failServerUpload( 'five.txt' );
		await finishServerUpload( 'six.txt' );

		await waitFor( () =>
			expect( onFilesChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { id: 'four.txt' } ),
				expect.objectContaining( { id: 'six.txt' } ),
			] )
		);
		expect( onError ).toHaveBeenCalledWith( 'five.txt was refused.' );
	} );

	it( 'calls onBatchSuccess once, after the last file settles', async () => {
		const mediaUpload = setUpMediaUpload();
		const onSuccess = vi.fn();
		const onError = vi.fn();
		const queuedAtBatchSuccess = [];
		const onBatchSuccess = vi.fn( () =>
			queuedAtBatchSuccess.push(
				selectStore( uploadStore )
					.getItems()
					.map( ( item ) => item.file.name )
			)
		);

		mediaUpload( {
			filesList: createFiles( 'seven.txt', 'eight.txt', 'nine.txt' ),
			onSuccess,
			onError,
			onBatchSuccess,
		} );

		await finishServerUpload( 'seven.txt' );
		await finishServerUpload( 'nine.txt' );
		await waitFor( () => expect( onSuccess ).toHaveBeenCalledTimes( 2 ) );
		expect( onBatchSuccess ).not.toHaveBeenCalled();

		await failServerUpload( 'eight.txt' );
		await waitFor( () => expect( onError ).toHaveBeenCalled() );
		expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
		expect( onError ).toHaveBeenCalledBefore( onBatchSuccess );
		expect( queuedAtBatchSuccess ).toEqual( [ [] ] );
	} );

	it( 'does not create a batch when every file is refused before upload', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFileChange = vi.fn();
		const onError = vi.fn();
		const onBatchSuccess = vi.fn();

		mediaUpload( {
			allowedTypes: [ 'image' ],
			filesList: createFiles( 'refused-one.txt', 'refused-two.txt' ),
			onFileChange,
			onError,
			onBatchSuccess,
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 2 ) );
		expect( onError ).toHaveBeenCalledTimes( 2 );
		expect( onBatchSuccess ).not.toHaveBeenCalled();
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'waits for accepted files when other files are refused before upload', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFileChange = vi.fn();
		const onError = vi.fn();
		const onBatchSuccess = vi.fn();
		const acceptedFile = new File( [ 'image' ], 'accepted.png', {
			type: 'image/png',
		} );

		mediaUpload( {
			allowedTypes: [ 'image' ],
			filesList: [ createFiles( 'refused.txt' )[ 0 ], acceptedFile ],
			onFileChange,
			onError,
			onBatchSuccess,
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
		expect( onBatchSuccess ).not.toHaveBeenCalled();

		await finishServerUpload( 'accepted.png' );
		await waitFor( () =>
			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 )
		);
		expect( onFileChange ).toHaveBeenLastCalledWith( [
			expect.objectContaining( { id: 'accepted.png' } ),
		] );
	} );
} );
