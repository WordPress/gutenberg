/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostPreviewModalButton from '..';

jest.useRealTimers();

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch/use-dispatch', () =>
	jest.fn()
);

function mockUseSelect( overrides ) {
	useSelect.mockImplementation( ( map ) =>
		map( () => ( {
			getPostType: () => ( { viewable: true } ),
			getCurrentPostType: () => 'post',
			getCurrentPostAttribute: () => undefined,
			getEditedPostPreviewLink: () => undefined,
			isEditedPostSaveable: () => true,
			...overrides,
		} ) )
	);
}

function mockUseDispatch( overrides ) {
	useDispatch.mockImplementation( () => ( {
		__unstableSaveForPreview: () =>
			Promise.resolve( 'https://example.com/?preview=true' ),
		...overrides,
	} ) );
}

describe( 'PostPreviewModalButton', () => {
	beforeEach( () => {
		mockUseSelect();
		mockUseDispatch();
	} );

	afterEach( () => {
		useSelect.mockReset();
		useDispatch.mockReset();
	} );

	it( 'should not render if the post is not viewable.', () => {
		mockUseSelect( { getPostType: () => ( { viewable: false } ) } );

		render( <PostPreviewModalButton /> );

		expect(
			screen.queryByRole( 'button', { name: /Preview/ } )
		).not.toBeInTheDocument();
	} );

	it( 'should be accessibly disabled if the post is not saveable.', () => {
		mockUseSelect( { isEditedPostSaveable: () => false } );

		render( <PostPreviewModalButton /> );

		expect(
			screen.getByRole( 'button', { name: /Preview/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'should open the preview modal and render the generated preview link.', async () => {
		const user = userEvent.setup();
		let resolvePreview;
		const saveForPreview = jest.fn(
			() =>
				new Promise( ( resolve ) => {
					resolvePreview = resolve;
				} )
		);
		mockUseDispatch( { __unstableSaveForPreview: saveForPreview } );

		render( <PostPreviewModalButton forceIsAutosaveable /> );

		await user.click( screen.getByRole( 'button', { name: /Preview/ } ) );

		expect(
			screen.getByRole( 'dialog', { name: 'Preview' } )
		).toBeVisible();
		expect( screen.getByText( 'Generating preview…' ) ).toBeVisible();
		expect( saveForPreview ).toHaveBeenCalledWith( {
			forceIsAutosaveable: true,
		} );

		resolvePreview( 'https://example.com/?preview=true' );

		const iframe = await screen.findByTitle( 'Post preview' );
		expect( iframe ).toHaveAttribute(
			'src',
			'https://example.com/?preview=true'
		);
	} );

	it( 'should switch between desktop, tablet, and mobile preview sizes.', async () => {
		const user = userEvent.setup();

		render( <PostPreviewModalButton /> );

		await user.click( screen.getByRole( 'button', { name: /Preview/ } ) );

		const iframe = await screen.findByTitle( 'Post preview' );
		expect( iframe ).toHaveClass( 'is-desktop-preview' );

		await user.click( screen.getByRole( 'button', { name: 'Tablet' } ) );
		expect( iframe ).toHaveClass( 'is-tablet-preview' );

		await user.click( screen.getByRole( 'button', { name: 'Mobile' } ) );
		expect( iframe ).toHaveClass( 'is-mobile-preview' );
	} );

	it( 'should close when escape is pressed.', async () => {
		const user = userEvent.setup();

		render( <PostPreviewModalButton /> );

		await user.click( screen.getByRole( 'button', { name: /Preview/ } ) );
		await screen.findByRole( 'dialog', { name: 'Preview' } );
		await user.keyboard( '{Escape}' );

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Preview' } )
			).not.toBeInTheDocument()
		);
	} );
} );
