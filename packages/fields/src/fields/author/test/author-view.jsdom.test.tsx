import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import AuthorView from '../author-view';
import type { BasePostWithEmbeddedAuthor } from '../../../types';

function postWithAuthor(
	id: number,
	name: string,
	src: string
): BasePostWithEmbeddedAuthor {
	return {
		id: 1,
		type: 'post',
		title: 'Example post',
		content: '',
		author: id,
		_embedded: { author: [ { id, name, avatar_urls: { 48: src } } ] },
	};
}

describe( 'AuthorView', () => {
	it( 'replaces the displayed avatar when the post author changes', () => {
		const registry = createRegistry();
		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<AuthorView item={ postWithAuthor( 1, 'Alex', '/alex.png' ) } />
			</RegistryProvider>
		);
		const image =
			screen.queryByRole( 'presentation', { hidden: true } ) ??
			screen.getByRole( 'img', { hidden: true } );
		fireEvent.load( image );
		expect( screen.getByText( 'Alex' ) ).toBeVisible();
		expect( screen.queryByText( 'A' ) ).not.toBeInTheDocument();

		rerender(
			<RegistryProvider value={ registry }>
				<AuthorView item={ postWithAuthor( 2, 'Sam', '/sam.png' ) } />
			</RegistryProvider>
		);
		expect( screen.getByText( 'Sam' ) ).toBeVisible();
		expect( screen.queryByText( 'Alex' ) ).not.toBeInTheDocument();
		expect( image ).toHaveAttribute( 'src', '/sam.png' );
		fireEvent.error( image );
		expect( screen.getByText( 'S' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );
} );
