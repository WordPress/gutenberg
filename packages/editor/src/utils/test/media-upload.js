/**
 * Internal dependencies
 */
import mediaUpload from '../media-upload';
import {
	getState,
	reset,
} from '../../components/upload-progress-snackbar/tracker';

jest.mock( '@wordpress/media-utils', () => ( {
	uploadMedia: jest.fn(),
} ) );

jest.mock( '@wordpress/upload-media', () => ( {
	isClientSideMediaSupported: jest.fn( () => false ),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
} ) );

jest.mock( '../../store', () => ( {
	store: { name: 'core/editor' },
} ) );

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn( () => ( {
		getCurrentPost: () => ( { id: 1 } ),
		getEditorSettings: () => ( {
			allowedMimeTypes: null,
			maxUploadFileSize: 10 * 1024 * 1024,
		} ),
	} ) ),
	dispatch: jest.fn( () => ( {
		receiveEntityRecords: jest.fn(),
		lockPostSaving: jest.fn(),
		unlockPostSaving: jest.fn(),
		lockPostAutosaving: jest.fn(),
		unlockPostAutosaving: jest.fn(),
	} ) ),
} ) );

describe( 'mediaUpload', () => {
	beforeEach( () => {
		reset();
	} );

	it( 'registers files with the upload progress tracker', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		mediaUpload( { filesList: [ file ] } );

		expect( getState() ).toEqual( {
			total: 1,
			completed: 0,
			pending: [ 'photo.jpg' ],
		} );
	} );

	it( 'skips tracker registration when the caller tracks progress itself', () => {
		// The upload-media queue calls this wrapper as its server transport
		// and already counts its own queue items for the progress snackbar;
		// registering the same file here would double-count it
		// (see gutenberg#80369).
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		mediaUpload( { filesList: [ file ], skipTracking: true } );

		expect( getState() ).toBeNull();
	} );
} );
