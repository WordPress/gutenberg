/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TermPermalinkEdit from '../edit';

// Mock the useBlockProps hook
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn( () => ( {
		className: 'wp-block-term-permalink',
	} ) ),
} ) );

// Mock the useToolsPanelDropdownMenuProps hook
jest.mock( '../../utils/hooks', () => ( {
	useToolsPanelDropdownMenuProps: jest.fn( () => ( {} ) ),
} ) );

describe( 'Term Permalink block', () => {
	const defaultProps = {
		attributes: {
			content: '',
			linkTarget: '_self',
		},
		setAttributes: jest.fn(),
		insertBlocksAfter: jest.fn(),
		context: {
			termId: 1,
			taxonomy: 'category',
		},
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should render with placeholder text', () => {
		render( <TermPermalinkEdit { ...defaultProps } /> );

		const input = screen.getByRole( 'textbox', {
			name: '"View term" link text',
		} );
		expect( input ).toBeInTheDocument();
	} );

	test( 'should render with custom content', () => {
		const props = {
			...defaultProps,
			attributes: {
				...defaultProps.attributes,
				content: 'View Category',
			},
		};

		render( <TermPermalinkEdit { ...props } /> );

		const input = screen.getByRole( 'textbox', {
			name: '"View term" link text',
		} );
		expect( input ).toHaveTextContent( 'View Category' );
	} );

	test( 'should call setAttributes when content changes', async () => {
		const user = userEvent.setup();
		render( <TermPermalinkEdit { ...defaultProps } /> );

		const input = screen.getByRole( 'textbox', {
			name: '"View term" link text',
		} );
		await user.click( input );
		await user.type( input, 'Read more' );

		expect( defaultProps.setAttributes ).toHaveBeenCalled();
	} );

	test( 'should have correct block props', () => {
		render( <TermPermalinkEdit { ...defaultProps } /> );

		expect( useBlockProps ).toHaveBeenCalled();
	} );
} );
