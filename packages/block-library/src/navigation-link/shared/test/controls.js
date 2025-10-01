/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Controls } from '../controls';

// Mock the updateAttributes function
let mockUpdateAttributes;
jest.mock( '../../update-attributes', () => ( {
	updateAttributes: ( ...args ) => mockUpdateAttributes( ...args ),
} ) );

// Mock the useToolsPanelDropdownMenuProps hook
jest.mock( '../../../utils/hooks', () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

describe( 'Controls', () => {
	// Initialize the mock function
	beforeAll( () => {
		mockUpdateAttributes = jest.fn();
	} );

	const defaultProps = {
		attributes: {
			label: 'Test Link',
			url: 'https://example.com',
			description: 'Test description',
			rel: 'nofollow',
			opensInNewTab: false,
		},
		setAttributes: jest.fn(),
		setIsEditingControl: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUpdateAttributes.mockClear();
	} );

	it( 'renders all form controls', () => {
		render( <Controls { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Text' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Link' ) ).toBeInTheDocument();
		expect(
			screen.getByLabelText( 'Open in new tab' )
		).toBeInTheDocument();
		expect( screen.getByLabelText( 'Description' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Rel attribute' ) ).toBeInTheDocument();
	} );

	it( 'strips HTML from label values', () => {
		const propsWithHtml = {
			...defaultProps,
			attributes: {
				...defaultProps.attributes,
				label: '<strong>Bold Text</strong>',
			},
		};
		render( <Controls { ...propsWithHtml } /> );

		const textInput = screen.getByLabelText( 'Text' );
		expect( textInput.value ).toBe( 'Bold Text' );
	} );

	it( 'decodes URL values for display', () => {
		const propsWithEncodedUrl = {
			...defaultProps,
			attributes: {
				...defaultProps.attributes,
				url: 'https://example.com/test%20page',
			},
		};
		render( <Controls { ...propsWithEncodedUrl } /> );

		const urlInput = screen.getByLabelText( 'Link' );
		expect( urlInput.value ).toBe( 'https://example.com/test page' );
	} );

	it( 'encodes URL values when changed', () => {
		render( <Controls { ...defaultProps } /> );

		const urlInput = screen.getByLabelText( 'Link' );

		fireEvent.change( urlInput, {
			target: { value: 'https://example.com/test page' },
		} );

		expect( defaultProps.setAttributes ).toHaveBeenCalledWith( {
			url: 'https://example.com/test%20page',
		} );
	} );

	it( 'calls updateAttributes on URL blur', () => {
		render( <Controls { ...defaultProps } /> );

		const urlInput = screen.getByLabelText( 'Link' );

		fireEvent.focus( urlInput );
		fireEvent.blur( urlInput );

		expect( mockUpdateAttributes ).toHaveBeenCalledWith(
			{ url: 'https://example.com' },
			defaultProps.setAttributes,
			{ ...defaultProps.attributes, url: 'https://example.com' }
		);
	} );

	it( 'stores last URL value on focus and uses it in updateAttributes', () => {
		const propsWithDifferentUrl = {
			...defaultProps,
			attributes: {
				...defaultProps.attributes,
				url: 'https://different.com',
			},
		};
		render( <Controls { ...propsWithDifferentUrl } /> );

		const urlInput = screen.getByLabelText( 'Link' );

		fireEvent.focus( urlInput );

		// Change the URL
		fireEvent.change( urlInput, {
			target: { value: 'https://new.com' },
		} );

		// Blur should call updateAttributes with the current URL (since url exists)
		fireEvent.blur( urlInput );

		expect( mockUpdateAttributes ).toHaveBeenCalledWith(
			{ url: 'https://different.com' }, // Current URL from attributes (not input value)
			defaultProps.setAttributes,
			{
				...propsWithDifferentUrl.attributes,
				url: 'https://different.com',
			} // lastURLRef.current
		);
	} );

	it( 'calls setIsEditingControl on focus and blur for all inputs', () => {
		render( <Controls { ...defaultProps } /> );

		const textInput = screen.getByLabelText( 'Text' );
		const urlInput = screen.getByLabelText( 'Link' );

		// Test text input
		fireEvent.focus( textInput );
		expect( defaultProps.setIsEditingControl ).toHaveBeenCalledWith( true );

		fireEvent.blur( textInput );
		expect( defaultProps.setIsEditingControl ).toHaveBeenCalledWith(
			false
		);

		// Test URL input
		fireEvent.focus( urlInput );
		expect( defaultProps.setIsEditingControl ).toHaveBeenCalledWith( true );

		fireEvent.blur( urlInput );
		expect( defaultProps.setIsEditingControl ).toHaveBeenCalledWith(
			false
		);
	} );

	it( 'handles all form field changes correctly', () => {
		render( <Controls { ...defaultProps } /> );

		// Test text change
		const textInput = screen.getByLabelText( 'Text' );
		fireEvent.change( textInput, { target: { value: 'New Label' } } );
		expect( defaultProps.setAttributes ).toHaveBeenCalledWith( {
			label: 'New Label',
		} );

		// Test description change
		const descriptionInput = screen.getByLabelText( 'Description' );
		fireEvent.change( descriptionInput, {
			target: { value: 'New Description' },
		} );
		expect( defaultProps.setAttributes ).toHaveBeenCalledWith( {
			description: 'New Description',
		} );

		// Test rel change
		const relInput = screen.getByLabelText( 'Rel attribute' );
		fireEvent.change( relInput, {
			target: { value: 'nofollow noopener' },
		} );
		expect( defaultProps.setAttributes ).toHaveBeenCalledWith( {
			rel: 'nofollow noopener',
		} );

		// Test checkbox change
		const checkbox = screen.getByLabelText( 'Open in new tab' );
		fireEvent.click( checkbox );
		expect( defaultProps.setAttributes ).toHaveBeenCalledWith( {
			opensInNewTab: true,
		} );
	} );
} );
