/**
 * Internal dependencies
 */
import { shouldDismissPastedFiles } from '../pasting';

const mocks = {
	pngImageFile: { type: 'image/png' },
	jpgImageFile: { type: 'image/jpg' },
	documentFile: { type: 'application/zip' },
};

describe( 'shouldDismissPastedFiles', () => {
	it( 'should return false when no HTML is present', () => {
		expect( shouldDismissPastedFiles( [ mocks.pngImageFile ], '' ) ).toBe(
			false
		);
	} );
	it( 'should return false when file is not an image', () => {
		expect( shouldDismissPastedFiles( [ mocks.documentFile ], '' ) ).toBe(
			false
		);
	} );
	it( 'should return false when multiple images are present', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile, mocks.jpgImageFile ],
				''
			)
		).toBe( false );
	} );
	it( 'should return false when the HTML contains a single image', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<img src="path.png">'
			)
		).toBe( false );
	} );
	it( 'should return true when the HTML contains more than one image', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<img src="1.png"><br><img src="2.png">'
			)
		).toBe( true );
	} );

	/*
	 * REAL-WORLD SCENARIOS
	 */

	it( 'should return false when pasting an image from Google Photos', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<img src="https://lh3.googleusercontent.com/ab/SOMESTRING?authuser=0">'
			)
		).toBe( false );
	} );

	it( 'should return false when pasting an image from Apple Numbers', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<figure><img src="blob:..."></figure>'
			)
		).toBe( false );
	} );

	it( 'should return true when pasting a table from Apple Numbers', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<meta charset="UTF-8"><table>Some table text</table>'
			)
		).toBe( true );
	} );

	it( 'should return true when pasting an image-containing MS Word document via Chrome', () => {
		expect(
			shouldDismissPastedFiles(
				[ mocks.pngImageFile ],
				'<p>A</p><img src="file:////.../clip_image001.png" alt="..."><p>B</p>'
			)
		).toBe( true );
	} );
} );
