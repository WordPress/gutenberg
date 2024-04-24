/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostSlug from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch/use-dispatch', () =>
	jest.fn()
);

describe( 'PostSlug', () => {
	it( 'should update slug with sanitized input', async () => {
		const user = userEvent.setup();
		const editPost = jest.fn();

		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getPostType: () => null,
				getEditedPostAttribute: () => 'post',
				getEditedPostSlug: () => '1',
			} ) )
		);
		useDispatch.mockImplementation( () => ( {
			editPost,
		} ) );

		render( <PostSlug /> );

		const input = screen.getByRole( 'textbox', { name: 'Slug' } );
		await user.type( input, '2', {
			initialSelectionStart: 0,
			initialSelectionEnd: 1,
		} );
		act( () => input.blur() );

		expect( editPost ).toHaveBeenCalledWith( { slug: '2' } );
	} );
} );
