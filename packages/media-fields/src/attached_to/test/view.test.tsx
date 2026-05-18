/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import type { NormalizedField } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import MediaAttachedToView from '../view';
import type { MediaItem } from '../../types';

// The view component only reads `item`; a stub is enough to satisfy the
// `DataViewRenderFieldProps` signature without dragging in the edit
// component's `@wordpress/core-data` import chain.
const field = {} as NormalizedField< MediaItem >;

describe( 'MediaAttachedToView', () => {
	it( 'renders the rendered post title when the embedded post matches the parent', () => {
		const item: Partial< MediaItem > = {
			post: 42,
			_embedded: {
				'wp:attached-to': [
					{
						id: 42,
						title: { raw: 'Hello world', rendered: 'Hello world' },
					},
				],
			},
		};

		render(
			<MediaAttachedToView item={ item as MediaItem } field={ field } />
		);

		expect( screen.getByText( 'Hello world' ) ).toBeInTheDocument();
	} );

	it( 'falls back to "(no title)" when the embedded post is loaded but has an empty title', () => {
		const item: Partial< MediaItem > = {
			post: 42,
			_embedded: {
				'wp:attached-to': [
					{
						id: 42,
						title: { raw: '', rendered: '' },
					},
				],
			},
		};

		render(
			<MediaAttachedToView item={ item as MediaItem } field={ field } />
		);

		expect( screen.getByText( '(no title)' ) ).toBeInTheDocument();
		expect( screen.queryByText( '42' ) ).not.toBeInTheDocument();
	} );

	it( 'renders "(Unattached)" when there is no parent post', () => {
		const item: Partial< MediaItem > = {
			post: 0,
		};

		render(
			<MediaAttachedToView item={ item as MediaItem } field={ field } />
		);

		expect( screen.getByText( '(Unattached)' ) ).toBeInTheDocument();
	} );

	it( 'does not render the title yet when the embedded post id does not match the parent', () => {
		// Stale embedded data from a prior attachment shouldn't be shown
		// for the new parent until the matching record loads.
		const item: Partial< MediaItem > = {
			post: 42,
			_embedded: {
				'wp:attached-to': [
					{
						id: 7,
						title: { raw: 'Old title', rendered: 'Old title' },
					},
				],
			},
		};

		const { container } = render(
			<MediaAttachedToView item={ item as MediaItem } field={ field } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
