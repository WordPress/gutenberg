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
		isBoundEntityAvailable: false,
		clearBinding: jest.fn(),
	} ) ),
} ) );

// Mock the useIsInvalidLink hook
jest.mock( '../use-is-invalid-link', () => ( {
	useIsInvalidLink: jest.fn( () => [ false, false ] ),
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

		// Reset useEntityBinding mock to default
		const { useEntityBinding } = require( '../use-entity-binding' );
		useEntityBinding.mockReturnValue( {
			hasUrlBinding: false,
			isBoundEntityAvailable: false,
			clearBinding: jest.fn(),
		} );

		// Reset useIsInvalidLink mock to default
		const { useIsInvalidLink } = require( '../use-is-invalid-link' );
		useIsInvalidLink.mockReturnValue( [ false, false ] );
	} );

	it( 'renders all form controls', () => {
		render( <Controls { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Text' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Link to' ) ).toBeInTheDocument();
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
		it( 'shows invalid link help text when bound entity is not available', () => {
			const { useEntityBinding } = require( '../use-entity-binding' );
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				isBoundEntityAvailable: false,
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
				screen.getByText(
					'This link is invalid and will not appear on your site. Please update the link.'
				)
			).toBeInTheDocument();
		} );

		it( 'shows draft help text for draft entities', () => {
			const { useIsInvalidLink } = require( '../use-is-invalid-link' );
			useIsInvalidLink.mockReturnValue( [ false, true ] ); // isInvalid: false, isDraft: true

			const propsWithDraftPage = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					type: 'page',
					kind: 'post-type',
				},
			};

			render( <Controls { ...propsWithDraftPage } /> );

			expect(
				screen.getByText(
					'This link is to a draft page and will not appear on your site until the page is published.'
				)
			).toBeInTheDocument();
		} );

		it( 'shows draft help text for different entity types', () => {
			const { useIsInvalidLink } = require( '../use-is-invalid-link' );
			useIsInvalidLink.mockReturnValue( [ false, true ] );

			const propsWithDraftPost = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					type: 'post',
					kind: 'post-type',
				},
			};

			render( <Controls { ...propsWithDraftPost } /> );

			expect(
				screen.getByText(
					'This link is to a draft post and will not appear on your site until the post is published.'
				)
			).toBeInTheDocument();
		} );

		it( 'does not show help text for valid link', () => {
			const propsWithValidLink = {
				...defaultProps,
				attributes: {
					...defaultProps.attributes,
					url: 'https://example.com',
					type: 'page',
					kind: 'post-type',
				},
			};

			render( <Controls { ...propsWithValidLink } /> );

			// When link is valid (not invalid, not draft, no binding issues), no help text should be shown
			expect( screen.queryByText( /This link/ ) ).not.toBeInTheDocument();
		} );
	} );
} );
