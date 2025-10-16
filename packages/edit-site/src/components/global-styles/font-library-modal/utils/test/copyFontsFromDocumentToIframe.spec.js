/**
 * Internal dependencies
 */
import { copyFontsFromDocumentToIframe } from '../index';

describe( 'copyFontsFromDocumentToIframe', () => {
	const originalQuerySelector = document.querySelector;
	const originalDocumentFonts = document.fonts;

	beforeEach( () => {
		jest.clearAllMocks();
		// Mock document.querySelector
		document.querySelector = jest.fn();
		// Mock document.fonts with forEach method
		document.fonts = {
			forEach: jest.fn(),
		};
	} );

	afterEach( () => {
		// Restore original methods
		document.querySelector = originalQuerySelector;
		document.fonts = originalDocumentFonts;
	} );

	test( 'should not error when iframe does not exist', () => {
		// Mock querySelector to return null (no iframe)
		document.querySelector.mockReturnValue( null );

		// This should not throw an error
		expect( () => copyFontsFromDocumentToIframe() ).not.toThrow();
	} );

	test( 'should not error when iframe exists but has no contentDocument', () => {
		// Mock querySelector to return iframe without contentDocument
		document.querySelector.mockReturnValue( {} );

		// This should not throw an error
		expect( () => copyFontsFromDocumentToIframe() ).not.toThrow();
	} );

	test( 'should copy fonts when iframe and contentDocument exist', () => {
		const mockIframeDocument = {
			fonts: {
				forEach: jest.fn(),
				add: jest.fn(),
			},
		};

		const mockIframe = {
			contentDocument: mockIframeDocument,
		};

		// Mock document.fonts.forEach to simulate fonts in root document
		const mockFontFace = {
			family: 'Test Font',
			weight: '400',
			style: 'normal',
		};

		document.fonts.forEach.mockImplementation( ( callback ) => {
			callback( mockFontFace );
		} );

		// Mock iframe.contentDocument.fonts.forEach to simulate no fonts in iframe
		mockIframeDocument.fonts.forEach.mockImplementation( () => {
			// No fonts in iframe initially
		} );

		document.querySelector.mockReturnValue( mockIframe );

		copyFontsFromDocumentToIframe();

		// Should have attempted to add the font to iframe
		expect( mockIframeDocument.fonts.add ).toHaveBeenCalledWith(
			mockFontFace
		);
	} );

	test( 'should not duplicate fonts that already exist in iframe', () => {
		const mockFontFace = {
			family: 'Test Font',
			weight: '400',
			style: 'normal',
		};

		const mockIframeDocument = {
			fonts: {
				forEach: jest.fn(),
				add: jest.fn(),
			},
		};

		const mockIframe = {
			contentDocument: mockIframeDocument,
		};

		// Mock document.fonts.forEach to simulate fonts in root document
		document.fonts.forEach.mockImplementation( ( callback ) => {
			callback( mockFontFace );
		} );

		// Mock iframe.contentDocument.fonts.forEach to simulate the same font already exists
		mockIframeDocument.fonts.forEach.mockImplementation( ( callback ) => {
			callback( mockFontFace ); // Same font already exists
		} );

		document.querySelector.mockReturnValue( mockIframe );

		copyFontsFromDocumentToIframe();

		// Should NOT have attempted to add the font to iframe since it already exists
		expect( mockIframeDocument.fonts.add ).not.toHaveBeenCalled();
	} );
} );
