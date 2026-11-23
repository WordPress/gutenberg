import { describe, expect, it } from 'vitest';
import { isPdfUrl } from '../is-pdf-url';

describe( 'isPdfUrl', () => {
	it.each( [
		[ 'https://example.com/files/report.pdf' ],
		[ 'https://example.com/files/Report.PDF' ],
		[ 'https://example.com/files/report.pdf?X-Signature=abc123' ],
		[ 'https://example.com/files/report.pdf#page=2' ],
	] )( 'returns true for %s', ( url ) => {
		expect( isPdfUrl( url ) ).toBe( true );
	} );

	it.each( [
		[ 'https://example.com/files/report.docx' ],
		[ 'https://example.com/files/report.docx?name=report.pdf' ],
		[ 'https://example.com/pdf/' ],
		[ '' ],
		[ undefined ],
	] )( 'returns false for %s', ( url ) => {
		expect( isPdfUrl( url ) ).toBe( false );
	} );
} );
