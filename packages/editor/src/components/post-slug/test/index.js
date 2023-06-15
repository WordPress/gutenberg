/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PostSlug } from '../';

describe( 'PostSlug', () => {
	it( 'should update slug with sanitized input', async () => {
		const user = userEvent.setup();
		const onUpdateSlug = jest.fn();

		render( <PostSlug postSlug="index" onUpdateSlug={ onUpdateSlug } /> );

		const input = screen.getByRole( 'textbox', { name: 'Slug' } );
		await user.clear( input );
		await user.type( input, 'Foo Bar-Baz 9!' );
		act( () => input.blur() );

		expect( onUpdateSlug ).toHaveBeenCalledWith( 'foo-bar-baz-9' );
	} );
} );
