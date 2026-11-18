import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuthorView from '../post_type_supports/author/view';

const maria = { id: 2, name: 'Maria' };

describe( 'AuthorView', () => {
	it( 'shows the avatar of the author before their name', () => {
		render(
			<AuthorView
				item={ {
					author: 2,
					_embedded: {
						author: [
							{ ...maria, avatar_urls: { 48: '/maria.png' } },
						],
					},
				} }
			/>
		);
		expect( screen.getByText( 'Maria' ) ).toBeInTheDocument();
		// The avatar is decorative, so its image has an empty alt text.
		expect( screen.getByAltText( '' ) ).toHaveAttribute(
			'src',
			'/maria.png'
		);
	} );

	it( 'shows the name alone when the site lists no avatar URLs', () => {
		render(
			<AuthorView
				item={ { author: 2, _embedded: { author: [ maria ] } } }
			/>
		);
		const name = screen.getByText( 'Maria' );
		expect( screen.queryByAltText( '' ) ).not.toBeInTheDocument();
		// Nothing stands in for the avatar, so the name is aligned with the
		// other values.
		// eslint-disable-next-line testing-library/no-node-access -- Checks the row holds the name alone.
		expect( name.parentElement?.children ).toHaveLength( 1 );
	} );
} );
