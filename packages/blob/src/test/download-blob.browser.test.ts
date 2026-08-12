import { afterAll, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from '..';

describe( 'downloadBlob', () => {
	const createObjectURL = vi
		.spyOn( window.URL, 'createObjectURL' )
		.mockReturnValue( 'blob:pannacotta' );
	const revokeObjectURL = vi
		.spyOn( window.URL, 'revokeObjectURL' )
		.mockImplementation( () => {} );
	const mockAnchorElement = document.createElement( 'a' );
	let displayWhenClicked = '';
	mockAnchorElement.click = vi.fn( () => {
		displayWhenClicked = getComputedStyle( mockAnchorElement ).display;
	} );
	const createElementSpy = vi
		.spyOn( document, 'createElement' )
		.mockReturnValue( mockAnchorElement );

	const mockBlob = {};
	const blobSpy = vi.spyOn( window, 'Blob' ).mockImplementation(
		class MockBlob {
			constructor() {
				return mockBlob;
			}
		} as unknown as typeof Blob
	);
	vi.spyOn( document.body, 'appendChild' );
	vi.spyOn( document.body, 'removeChild' );

	afterAll( () => {
		vi.restoreAllMocks();
	} );

	it( 'requires a filename argument', () => {
		downloadBlob( '', '{}', 'application/json' );
		expect( blobSpy ).not.toHaveBeenCalled();
	} );

	it( 'requires a content argument', () => {
		downloadBlob( 'text.txt', '', 'text/plain' );
		expect( blobSpy ).not.toHaveBeenCalled();
	} );

	it( 'constructs a hidden anchor and removes it', () => {
		downloadBlob( 'filename.json', '{}', 'application/json' );

		expect( blobSpy ).toHaveBeenCalledWith( [ '{}' ], {
			type: 'application/json',
		} );
		expect( createObjectURL ).toHaveBeenCalledWith( mockBlob );
		expect( createElementSpy ).toHaveBeenCalledWith( 'a' );
		expect( mockAnchorElement.download ).toBe( 'filename.json' );
		expect( mockAnchorElement.href ).toBe( 'blob:pannacotta' );
		expect( displayWhenClicked ).toBe( 'none' );
		expect( document.body.appendChild ).toHaveBeenCalledWith(
			mockAnchorElement
		);
		expect( mockAnchorElement.click ).toHaveBeenCalledTimes( 1 );
		expect( document.body.removeChild ).toHaveBeenCalledWith(
			mockAnchorElement
		);
		expect( revokeObjectURL ).toHaveBeenCalled();
	} );
} );
