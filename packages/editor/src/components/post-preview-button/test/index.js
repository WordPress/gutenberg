/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PostPreviewButton } from '../';

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
		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'button' ) ).toHaveClass(
			'editor-post-preview'
		);
	} );

	it( 'should render with a custom class and not `editor-post-preview` if `className` is specified.', () => {
		render( <PostPreviewButton className="foo-bar" /> );

		const button = screen.getByRole( 'button' );

		expect( button ).toHaveClass( 'foo-bar' );
		expect( button ).not.toHaveClass( 'editor-post-preview' );
	} );

	it( 'should render a tertiary button if no classname is specified.', () => {
		render( <PostPreviewButton /> );

		expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-tertiary' );
	} );

	it( 'should render the button in its default variant if a custom classname is specified.', () => {
		render( <PostPreviewButton className="foo-bar" /> );

		const button = screen.getByRole( 'button' );

		expect( button ).not.toHaveClass( 'is-primary' );
		expect( button ).not.toHaveClass( 'is-secondary' );
		expect( button ).not.toHaveClass( 'is-tertiary' );
		expect( button ).not.toHaveClass( 'is-link' );
	} );

	it( 'should render `textContent` if specified.', () => {
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
		render( <PostPreviewButton /> );

		const button = screen.getByRole( 'button' );

		expect( within( button ).getByText( 'Preview' ) ).toBeVisible();
		expect(
			within( button ).getByText( '(opens in a new tab)' )
		).toBeInTheDocument();
	} );

	it( 'should be disabled if post is not saveable.', async () => {
		render( <PostPreviewButton isSaveable={ false } postId={ 123 } /> );

		expect( screen.getByRole( 'button' ) ).toBeDisabled();
	} );

	it( 'should not be disabled if post is saveable.', async () => {
		render( <PostPreviewButton isSaveable postId={ 123 } /> );

		expect( screen.getByRole( 'button' ) ).toBeEnabled();
	} );

	it( 'should set `href` to `previewLink` if `previewLink` is specified.', async () => {
		const url = 'https://wordpress.org';

		render(
			<PostPreviewButton isSaveable postId={ 123 } previewLink={ url } />
		);

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', url );
	} );

	it( 'should set `href` to `currentPostLink` if `currentPostLink` is specified.', async () => {
		const url = 'https://wordpress.org';

		render(
			<PostPreviewButton
				isSaveable
				postId={ 123 }
				currentPostLink={ url }
			/>
		);

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', url );
	} );

	it( 'should prioritize `previewLink` if both `previewLink` and `currentPostLink` are specified.', async () => {
		const url1 = 'https://wordpress.org';
		const url2 = 'https://wordpress.com';

		render(
			<PostPreviewButton
				isSaveable
				postId={ 123 }
				previewLink={ url1 }
				currentPostLink={ url2 }
			/>
		);

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', url1 );
	} );

	it( 'should properly set target to `wp-preview-${ postId }`.', async () => {
		const postId = 123;
		const url = 'https://wordpress.org';

		render(
			<PostPreviewButton
				isSaveable
				postId={ postId }
				previewLink={ url }
			/>
		);

		expect( screen.getByRole( 'link' ) ).toHaveAttribute(
			'target',
			`wp-preview-${ postId }`
		);
	} );

	it( 'should save post if `isDraft` is `true`', async () => {
		const user = userEvent.setup();
		const url = 'https://wordpress.org';
		const savePost = jest.fn();
		const autosave = jest.fn();

		render(
			<PostPreviewButton
				isAutosaveable
				isSaveable
				isDraft
				postId={ 123 }
				previewLink={ url }
				savePost={ savePost }
				autosave={ autosave }
			/>
		);

		await user.click( screen.getByRole( 'link' ) );

		expect( savePost ).toHaveBeenCalledWith(
			expect.objectContaining( { isPreview: true } )
		);
		expect( autosave ).not.toHaveBeenCalled();
	} );

	it( 'should autosave post if `isDraft` is `false`', async () => {
		const user = userEvent.setup();
		const url = 'https://wordpress.org';
		const savePost = jest.fn();
		const autosave = jest.fn();

		render(
			<PostPreviewButton
				isAutosaveable
				isSaveable
				isDraft={ false }
				postId={ 123 }
				previewLink={ url }
				savePost={ savePost }
				autosave={ autosave }
			/>
		);

		await user.click( screen.getByRole( 'link' ) );

		expect( savePost ).not.toHaveBeenCalled();
		expect( autosave ).toHaveBeenCalledWith(
			expect.objectContaining( { isPreview: true } )
		);
	} );

	it( 'should open a window with the specified target', async () => {
		const user = userEvent.setup();
		const postId = 123;
		const url = 'https://wordpress.org';

		render(
			<PostPreviewButton
				isAutosaveable
				isSaveable
				postId={ postId }
				previewLink={ url }
				savePost={ jest.fn() }
				autosave={ jest.fn() }
			/>
		);

		await user.click( screen.getByRole( 'link' ) );

		expect( global.open ).toHaveBeenCalledWith(
			'',
			`wp-preview-${ postId }`
		);
	} );

	it( 'should set the location in the window properly', async () => {
		const user = userEvent.setup();
		const postId = 123;
		const url = 'https://wordpress.org';

		const { rerender } = render(
			<PostPreviewButton
				isSaveable
				postId={ postId }
				savePost={ jest.fn() }
				autosave={ jest.fn() }
			/>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( setLocation ).toHaveBeenCalledWith( undefined );

		rerender(
			<PostPreviewButton
				isSaveable
				postId={ postId }
				previewLink={ url }
				savePost={ jest.fn() }
				autosave={ jest.fn() }
			/>
		);

		expect( setLocation ).toHaveBeenCalledWith( url );
	} );

	it( 'should display a `Generating preview` message while waiting for autosaving', async () => {
		const user = userEvent.setup();
		const previewText = 'Generating preview…';
		const url = 'https://wordpress.org';
		const savePost = jest.fn();
		const autosave = jest.fn();

		render(
			<PostPreviewButton
				isAutosaveable
				isSaveable
				isDraft={ false }
				postId={ 123 }
				previewLink={ url }
				savePost={ savePost }
				autosave={ autosave }
			/>
		);

		await user.click( screen.getByRole( 'link' ) );

		expect( documentWrite ).toHaveBeenCalledWith(
			expect.stringContaining( previewText )
		);
		expect( documentTitle ).toHaveBeenCalledWith( previewText );
		expect( documentClose ).toHaveBeenCalled();
	} );
} );
