import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadMedia } from '@wordpress/media-utils';
import mediaUpload from '../media-upload';

vi.mock( import( '@wordpress/media-utils' ), () => ( {
	uploadMedia: vi.fn(),
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: { name: 'core' },
} ) );

vi.mock( import( '../../store' ), () => ( {
	store: { name: 'core/editor' },
} ) );

const mockLockPostSaving = vi.fn();
const mockLockPostAutosaving = vi.fn();

vi.mock( import( '@wordpress/data' ), () => ( {
	select: vi.fn( () => ( {
		getCurrentPost: () => ( { id: 1 } ),
		getEditorSettings: () => ( {
			allowedMimeTypes: null,
			maxUploadFileSize: 10 * 1024 * 1024,
		} ),
	} ) ),
	dispatch: vi.fn( () => ( {
		receiveEntityRecords: vi.fn(),
		lockPostSaving: mockLockPostSaving,
		unlockPostSaving: vi.fn(),
		lockPostAutosaving: mockLockPostAutosaving,
		unlockPostAutosaving: vi.fn(),
	} ) ),
} ) );

describe( 'mediaUpload', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'forwards files to uploadMedia and locks saving', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		mediaUpload( { filesList: [ file ] } );

		expect( uploadMedia ).toHaveBeenCalledWith(
			expect.objectContaining( {
				filesList: [ file ],
				isTransportOnly: false,
			} )
		);
		expect( mockLockPostSaving ).toHaveBeenCalled();
		expect( mockLockPostAutosaving ).toHaveBeenCalled();
	} );

	it( 'forwards isTransportOnly and skips save locking for transport-only calls', () => {
		// The upload-media queue calls this wrapper as its server transport;
		// it already counts its own queue items for the progress snackbar
		// (registering the same file in uploadMedia would double-count it, see
		// gutenberg#80369) and locks saving via useUploadSaveLock.
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		mediaUpload( { filesList: [ file ], isTransportOnly: true } );

		expect( uploadMedia ).toHaveBeenCalledWith(
			expect.objectContaining( {
				filesList: [ file ],
				isTransportOnly: true,
			} )
		);
		expect( mockLockPostSaving ).not.toHaveBeenCalled();
		expect( mockLockPostAutosaving ).not.toHaveBeenCalled();
	} );
} );
