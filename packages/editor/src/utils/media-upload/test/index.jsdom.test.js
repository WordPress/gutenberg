import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';
import mediaUpload from '../';

vi.mock( import( '@wordpress/media-utils' ), () => ( {
	uploadMedia: vi.fn(),
} ) );

// The module under test only reaches the stores through `select`/`dispatch`,
// so they stand in for the whole data layer here - importing the real editor
// store pulls in most of the editor.
vi.mock( import( '@wordpress/data' ), () => ( {
	select: vi.fn(),
	dispatch: vi.fn(),
} ) );
vi.mock( import( '@wordpress/core-data' ), () => ( { store: 'core' } ) );
vi.mock( import( '../../../store' ), () => ( { store: 'core/editor' } ) );

function file( name ) {
	return new window.File( [ 'x' ], name, { type: 'image/png' } );
}

describe( 'mediaUpload', () => {
	beforeEach( () => {
		uploadMedia.mockClear();
		select.mockReturnValue( {
			getCurrentPost: () => ( { id: 1 } ),
			getEditorSettings: () => ( {} ),
		} );
		dispatch.mockReturnValue( {
			receiveEntityRecords: vi.fn(),
			lockPostSaving: vi.fn(),
			unlockPostSaving: vi.fn(),
			lockPostAutosaving: vi.fn(),
			unlockPostAutosaving: vi.fn(),
		} );
	} );

	it( 'uploads a batch when the caller takes more than one file', () => {
		const filesList = [ file( 'a.png' ), file( 'b.png' ) ];
		mediaUpload( {
			filesList,
			multiple: true,
		} );

		expect( uploadMedia ).toHaveBeenCalledWith(
			expect.objectContaining( {
				filesList,
				multiple: true,
				isTransportOnly: false,
			} )
		);
	} );

	it( 'uploads a single file for a caller that only takes one', () => {
		const filesList = [ file( 'a.png' ) ];
		mediaUpload( {
			filesList,
			multiple: false,
		} );

		expect( uploadMedia ).toHaveBeenCalledWith(
			expect.objectContaining( {
				filesList,
				multiple: false,
				isTransportOnly: false,
			} )
		);
	} );

	it( 'refuses a batch of more than one file for a caller that only takes one', () => {
		const onError = vi.fn();

		mediaUpload( {
			filesList: [ file( 'a.png' ), file( 'b.png' ), file( 'c.png' ) ],
			multiple: false,
			onError,
		} );

		expect( onError ).toHaveBeenCalledTimes( 1 );
		expect( onError ).toHaveBeenCalledWith(
			'Only one file can be used here.'
		);
		expect( uploadMedia ).not.toHaveBeenCalled();
	} );
} );
