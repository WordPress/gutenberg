import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
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

function setUpMediaUpload() {
	let mediaUpload;
	const GetMediaUpload = () => {
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
	it( 'reports every file uploaded so far, in file order, on each onFileChange call', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFileChange = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'one.txt', 'two.txt', 'three.txt' ),
			onFileChange,
		} );

		await finishServerUpload( 'three.txt' );
		await waitFor( () =>
			expect( onFileChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { url: 'blob:one.txt' } ),
				expect.objectContaining( { url: 'blob:two.txt' } ),
				expect.objectContaining( { id: 'three.txt' } ),
			] )
		);

		await finishServerUpload( 'one.txt' );
		await finishServerUpload( 'two.txt' );
		await waitFor( () =>
			expect( onFileChange ).toHaveBeenLastCalledWith( [
				expect.objectContaining( { id: 'one.txt' } ),
				expect.objectContaining( { id: 'two.txt' } ),
				expect.objectContaining( { id: 'three.txt' } ),
			] )
		);
	} );

	it( 'drops a failed file from the files it reports', async () => {
		const mediaUpload = setUpMediaUpload();
		const onFileChange = vi.fn();
		const onError = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'four.txt', 'five.txt', 'six.txt' ),
			onFileChange,
			onError,
		} );

		await finishServerUpload( 'four.txt' );
		await failServerUpload( 'five.txt' );
		await finishServerUpload( 'six.txt' );

		await waitFor( () =>
			expect( onFileChange ).toHaveBeenLastCalledWith( [
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
		const onBatchSuccess = vi.fn();

		mediaUpload( {
			filesList: createFiles( 'seven.txt', 'eight.txt', 'nine.txt' ),
			onSuccess,
			onError,
			onBatchSuccess,
		} );

		await finishServerUpload( 'seven.txt' );
		await failServerUpload( 'eight.txt' );
		await waitFor( () => {
			expect( onSuccess ).toHaveBeenCalled();
			expect( onError ).toHaveBeenCalled();
		} );
		expect( onBatchSuccess ).not.toHaveBeenCalled();

		await finishServerUpload( 'nine.txt' );
		await waitFor( () =>
			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 )
		);
	} );
} );
