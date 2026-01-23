/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostPreviewButton from '..';

jest.useRealTimers();

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch/use-dispatch', () =>
	jest.fn()
);

function mockUseSelect( overrides ) {
	useSelect.mockImplementation( ( map ) =>
		map( () => ( {
			getPostType: () => ( { viewable: true } ),
			getCurrentPostId: () => 123,
			getCurrentPostType: () => 'post',
			getCurrentPostAttribute: () => undefined,
			getEditedPostPreviewLink: () => undefined,
			isEditedPostSaveable: () => false,
			...overrides,
		} ) )
	);
	useDispatch.mockImplementation( () => ( {
		__unstableSaveForPreview: () => Promise.resolve(),
	} ) );
}

describe( 'PostPreviewButton', () => {
	const documentWrite = jest.fn();
	const documentTitle = jest.fn();
	const documentClose = jest.fn();
	const setLocation = jest.fn();

	beforeEach( () => {
		global.open = jest.fn( () => ( {
			focus: jest.fn(),
			document: {
				write: documentWrite,
				close: documentClose,
				get title() {},
				set title( value ) {
					documentTitle( value );
				},
			},
			get location() {},
			set location( value ) {
				setLocation( value );
			},
		} ) );
	} );

	afterEach( () => {
		global.open.mockRestore();
		documentWrite.mockReset();
		documentTitle.mockReset();
		documentClose.mockReset();
		setLocation.mockReset();
	} );

	it( 'should render with `editor-post-preview` class if no `className` is specified.', () => {
		mockUseSelect();

		render( <PostPreviewButton /> );

		const button = screen.getByRole( 'button' );
		expect( button ).toHaveClass( 'editor-post-preview' );
	} );

	it( 'should render with a custom class and not `editor-post-preview` if `className` is specified.', () => {
		mockUseSelect();

		render( <PostPreviewButton className="foo-bar" /> );

		const button = screen.getByRole( 'button' );
		expect( button ).toHaveClass( 'foo-bar' );
		expect( button ).not.toHaveClass( 'editor-post-preview' );
	} );

	it( 'should render a tertiary button if no classname is specified.', () => {
		mockUseSelect();

		render( <PostPreviewButton /> );

		const button = screen.getByRole( 'button' );
		expect( button ).toHaveClass( 'is-tertiary' );
	} );

	it( 'should render the button in its default variant if a custom classname is specified.', () => {
		mockUseSelect();

		render( <PostPreviewButton className="foo-bar" /> );

		const button = screen.getByRole( 'button' );
		expect( button ).not.toHaveClass( 'is-primary' );
		expect( button ).not.toHaveClass( 'is-secondary' );
		expect( button ).not.toHaveClass( 'is-tertiary' );
		expect( button ).not.toHaveClass( 'is-link' );
	} );

	it( 'should render `textContent` if specified.', () => {
		mockUseSelect();

		const textContent = 'Foo bar';

		render( <PostPreviewButton textContent={ textContent } /> );

		const button = screen.getByRole( 'button' );
		expect( button ).toHaveTextContent( textContent );
		expect(
			within( button ).queryByText( 'Preview' )
		).not.toBeInTheDocument();
		expect(
			within( button ).queryByText( '(opens in a new tab)' )
		).not.toBeInTheDocument();
	} );

	it( 'should render `Preview` with accessibility text if `textContent` not specified.', () => {
		mockUseSelect();

		render( <PostPreviewButton /> );

		const button = screen.getByRole( 'button' );
		expect( within( button ).getByText( 'Preview' ) ).toBeVisible();
		expect(
			within( button ).getByText( '(opens in a new tab)' )
		).toBeInTheDocument();
	} );

	it( 'should be accessibly disabled if post is not saveable.', () => {
		mockUseSelect( { isEditedPostSaveable: () => false } );

		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'button' ) ).toBeEnabled();
		expect( screen.getByRole( 'button' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'should not be disabled if post is saveable.', () => {
		mockUseSelect( { isEditedPostSaveable: () => true } );

		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'button' ) ).toBeEnabled();
		expect( screen.getByRole( 'button' ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'should set `href` to edited post preview link if specified.', () => {
		const url = 'https://wordpress.org';
		mockUseSelect( {
			getEditedPostPreviewLink: () => url,
			isEditedPostSaveable: () => true,
		} );

		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', url );
	} );

	it( 'should set `href` to current post link if specified.', () => {
		const url = 'https://wordpress.org';
		mockUseSelect( {
			getCurrentPostAttribute: () => url,
			isEditedPostSaveable: () => true,
		} );

		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', url );
	} );

	it( 'should prioritize preview link if both preview link and link attribute are specified.', () => {
		const url1 = 'https://wordpress.org';
		const url2 = 'https://wordpress.com';
		mockUseSelect( {
			getEditedPostPreviewLink: () => url1,
			getCurrentPostAttribute: () => url2,
			isEditedPostSaveable: () => true,
		} );

		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', url1 );
	} );

	it( 'should properly set link target', () => {
		mockUseSelect( {
			getEditedPostPreviewLink: () => 'https://wordpress.org',
			isEditedPostSaveable: () => true,
		} );

		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'link' ) ).toHaveAttribute(
			'target',
			'wp-preview-123'
		);
	} );

	it( 'should open a window with the specified target', async () => {
		const user = userEvent.setup();

		mockUseSelect( {
			getEditedPostPreviewLink: () => 'https://wordpress.org',
			isEditedPostSaveable: () => true,
		} );

		render( <PostPreviewButton /> );

		await user.click( screen.getByRole( 'link' ) );

		expect( global.open ).toHaveBeenCalledWith( '', 'wp-preview-123' );
	} );

	it( 'should display a `Generating preview` message while waiting for autosaving', async () => {
		const user = userEvent.setup();

		mockUseSelect( {
			getEditedPostPreviewLink: () => 'https://wordpress.org',
			isEditedPostSaveable: () => true,
		} );

		render( <PostPreviewButton /> );

		await user.click( screen.getByRole( 'link' ) );

		const previewText = 'Generating preview…';

		expect( documentWrite ).toHaveBeenCalledWith(
			expect.stringContaining( previewText )
		);
		expect( documentTitle ).toHaveBeenCalledWith( previewText );
		expect( documentClose ).toHaveBeenCalled();
	} );
} );
