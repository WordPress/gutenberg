/**
 * Internal dependencies
 */
import { shouldDismissPastedFiles } from '../should-dismiss-pasted-files';

const mocks = {
	pngImageFile: { type: 'image/png' },
	jpgImageFile: { type: 'image/jpg' },
	documentFile: { type: 'application/zip' },
};

describe( 'shouldDismissPastedFiles', () => {
	it( 'should return false when no HTML is present', () => {
		expect(
			shouldDismissPastedFiles( [ mocks.pngImageFile ], '', '' )
		).toBe( false );
	} );
	it( 'should return false when file is not an image', () => {
		expect(
			shouldDismissPastedFiles( [ mocks.documentFile ], '', '' )
		).toBe( false );
	} );
	it( 'should return false when multiple images are present', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile, mocks.jpgImageFile ],
				'',
				''
			)
		).toBe( false );
	} );

	/*
	 * REAL-WORLD SCENARIOS
	 */

	it( 'should return false when pasting an image from Google Photos', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<img src="https://lh3.googleusercontent.com/ab/SOMESTRING?authuser=0">',
				'https://lh3.googleusercontent.com/ab/SOMESTRING?authuser=0'
			)
		).toBe( false );
	} );

	it( 'should return false when pasting an image from Apple Numbers', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<figure><img src="blob:..."></figure>',
				''
			)
		).toBe( false );
	} );

	it( 'should return true when pasting a table from Apple Numbers', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<meta charset="UTF-8"><table>Some table text</table>',
				'Some table text'
			)
		).toBe( true );
	} );
} );
