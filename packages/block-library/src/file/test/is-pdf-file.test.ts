import { describe, expect, it } from 'vitest';
import { isPdfFile } from '../utils/is-pdf-file';

describe( 'isPdfFile', () => {
	it( 'detects a PDF by its mime type', () => {
		expect(
			isPdfFile( {
				mimeType: 'application/pdf',
				url: 'https://example.com/download?id=123',
			} )
		).toBe( true );
	} );

	it.each( [
		'https://example.com/report.pdf',
		'https://example.com/report.PDF',
		'https://example.com/report.pdf?X-Signature=abc123',
		'https://example.com/report.pdf#page=2',
		'https://example.com/report.pdf?v=1#page=2',
		'/wp-content/uploads/report.pdf?ver=2',
	] )( 'detects a PDF by its file name in %s', ( url ) => {
		expect( isPdfFile( { url } ) ).toBe( true );
	} );

	it.each( [
		'https://example.com/report.docx',
		'https://example.com/report.docx?file=report.pdf',
		'https://example.com/report.pdf/download',
		'https://example.com/',
	] )( 'does not detect a PDF in %s', ( url ) => {
		expect( isPdfFile( { url } ) ).toBe( false );
	} );

	it( 'does not detect a PDF when the mime type is something else', () => {
		expect(
			isPdfFile( {
				mimeType: 'application/msword',
				url: 'https://example.com/download?id=123',
			} )
		).toBe( false );
	} );

	it( 'handles a missing URL and mime type', () => {
		expect( isPdfFile( {} ) ).toBe( false );
		expect( isPdfFile( { url: null } ) ).toBe( false );
		expect( isPdfFile() ).toBe( false );
	} );
} );
