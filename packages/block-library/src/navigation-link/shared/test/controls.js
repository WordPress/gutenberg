/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { Controls } from '../controls';

// Mock the updateAttributes function
let mockUpdateAttributes;
jest.mock( '../update-attributes', () => ( {
	updateAttributes: ( ...args ) => mockUpdateAttributes( ...args ),
} ) );

// Mock the useToolsPanelDropdownMenuProps hook
jest.mock( '../../../utils/hooks', () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

// Mock the useEntityBinding hook
jest.mock( '../use-entity-binding', () => ( {
	useEntityBinding: jest.fn( () => ( {
		hasUrlBinding: false,
		clearBinding: jest.fn(),
	} ) ),
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
		clientId: 'test-client-id',
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

	it( 'calls updateAttributes with new URL on blur', async () => {
		const user = userEvent.setup();
		render( <Controls { ...defaultProps } /> );

		const urlInput = screen.getByLabelText( 'Link' );

		await user.click( urlInput );
		await user.clear( urlInput );
		await user.type( urlInput, 'https://example.com/test page' );
		await user.tab();

		expect( mockUpdateAttributes ).toHaveBeenCalledWith(
			{ url: 'https://example.com/test page' },
			defaultProps.setAttributes,
			{ ...defaultProps.attributes, url: 'https://example.com' }
		);
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

		// Blur should call updateAttributes with the new URL value from the input
		fireEvent.blur( urlInput );

		expect( mockUpdateAttributes ).toHaveBeenCalledWith(
			{ url: 'https://new.com' }, // New URL from input value
			defaultProps.setAttributes,
			{
				...propsWithDifferentUrl.attributes,
				url: 'https://different.com',
			} // lastURLRef.current
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

	describe( 'URL binding help text', () => {
		it( 'shows help text when URL is bound to an entity', () => {
			const { useEntityBinding } = require( '../use-entity-binding' );
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				clearBinding: jest.fn(),
			} );

			const propsWithBinding = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					type: 'page',
					kind: 'post-type',
				},
			};

			render( <Controls { ...propsWithBinding } /> );

			expect(
				screen.getByText( 'Synced with the selected page.' )
			).toBeInTheDocument();
		} );

		it( 'shows help text for different entity types', () => {
			const { useEntityBinding } = require( '../use-entity-binding' );
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				clearBinding: jest.fn(),
			} );

			const propsWithCategoryBinding = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					type: 'category',
					kind: 'taxonomy',
				},
			};

			render( <Controls { ...propsWithCategoryBinding } /> );

			expect(
				screen.getByText( 'Synced with the selected category.' )
			).toBeInTheDocument();
		} );

		it( 'does not show help text when URL is not bound', () => {
			const { useEntityBinding } = require( '../use-entity-binding' );
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: false,
				clearBinding: jest.fn(),
			} );

			render( <Controls { ...defaultProps } /> );

			expect(
				screen.queryByText( /Synced with the selected/ )
			).not.toBeInTheDocument();
		} );

		it( 'shows help text for post entity type', () => {
			const { useEntityBinding } = require( '../use-entity-binding' );
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				clearBinding: jest.fn(),
			} );

			const propsWithPostBinding = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					type: 'post',
					kind: 'post-type',
				},
			};

			render( <Controls { ...propsWithPostBinding } /> );

			expect(
				screen.getByText( 'Synced with the selected post.' )
			).toBeInTheDocument();
		} );

		it( 'shows help text for tag entity type', () => {
			const { useEntityBinding } = require( '../use-entity-binding' );
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				clearBinding: jest.fn(),
			} );

			const propsWithTagBinding = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					type: 'tag',
					kind: 'taxonomy',
				},
			};

			render( <Controls { ...propsWithTagBinding } /> );

			expect(
				screen.getByText( 'Synced with the selected tag.' )
			).toBeInTheDocument();
		} );
	} );
} );
