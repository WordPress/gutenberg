import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { NormalizedField } from '@wordpress/dataviews';
import AuthorView from '../view';
import type { MediaItem } from '../../types';

vi.mock( import( '@wordpress/icons' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	commentAuthorAvatarAlt: (
		<svg>
			<title>Author fallback</title>
		</svg>
	),
} ) );

const field = {} as NormalizedField< MediaItem >;

describe( 'Media author view', () => {
	it( 'keeps the author name and icon fallback when the image fails', () => {
		const item = {
			_embedded: {
				author: [
					{
						id: 1,
						name: 'Alex',
						avatar_urls: { 48: '/missing.png' },
					},
				],
			},
		} as MediaItem;
		render( <AuthorView item={ item } field={ field } /> );
		expect( screen.getByText( 'Alex' ) ).toBeVisible();
		expect( screen.getByTitle( 'Author fallback' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );
} );
