import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import type { NormalizedField } from '@wordpress/dataviews';
import MediaAttachedToEdit from '../edit';
import type { MediaItem } from '../../types';

vi.mock( import( '@wordpress/core-data' ), () => {
	return {
		store: { name: 'core' },
	} as unknown as typeof import( '@wordpress/core-data' );
} );

vi.mock( import( '@wordpress/post-picker' ), () => {
	return {
		store: { name: 'core/post-picker' },
	} as unknown as typeof import( '@wordpress/post-picker' );
} );

const POST_TYPES = [
	{ slug: 'post', viewable: true, labels: { singular_name: 'Post' } },
	{ slug: 'page', viewable: true, labels: { singular_name: 'Page' } },
	{
		slug: 'attachment',
		viewable: true,
		labels: { singular_name: 'Media' },
	},
	{ slug: 'wp_block', viewable: false, labels: { singular_name: 'Pattern' } },
];

const ATTACHED_ITEM = {
	id: 10,
	post: 42,
	_embedded: {
		'wp:attached-to': [
			{
				id: 42,
				type: 'page',
				title: { raw: 'About', rendered: 'About' },
			},
		],
	},
} as unknown as MediaItem;

const UNATTACHED_ITEM = { id: 10, post: 0 } as unknown as MediaItem;

const field = {} as NormalizedField< MediaItem >;

function renderEdit( data: MediaItem, pickedPosts: unknown = null ) {
	const pickPosts = vi.fn();
	const registry = createRegistry();
	registry.registerStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getPostTypes: () => POST_TYPES,
			getPostType: ( state: unknown, slug: string ) =>
				POST_TYPES.find( ( postType ) => postType.slug === slug ),
		},
	} );
	registry.registerStore( 'core/post-picker', {
		reducer: ( state = {} ) => state,
		actions: {
			pickPosts: ( config: unknown ) => async () => {
				pickPosts( config );
				return pickedPosts;
			},
		},
	} );

	const onChange = vi.fn();
	render(
		<RegistryProvider value={ registry }>
			<MediaAttachedToEdit
				data={ data }
				field={ field }
				onChange={ onChange }
			/>
		</RegistryProvider>
	);
	return { onChange, pickPosts };
}

describe( 'MediaAttachedToEdit', () => {
	it( 'shows the attached content and its type', () => {
		renderEdit( ATTACHED_ITEM );

		expect( screen.getByText( 'About' ) ).toBeVisible();
		expect( screen.getByText( 'Page' ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Change' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Detach' } )
		).toBeVisible();
	} );

	it( 'offers to attach unattached media', () => {
		renderEdit( UNATTACHED_ITEM );

		expect(
			screen.getByText( 'This file isn’t attached to any content.' )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Attach' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Detach' } )
		).not.toBeInTheDocument();
	} );

	it( 'detaches the media', async () => {
		const user = userEvent.setup();
		const { onChange } = renderEdit( ATTACHED_ITEM );

		await user.click( screen.getByRole( 'button', { name: 'Detach' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			post: 0,
			_embedded: { 'wp:attached-to': undefined },
		} );
	} );

	it( 'opens the post picker with viewable post types', async () => {
		const user = userEvent.setup();
		const { pickPosts } = renderEdit( ATTACHED_ITEM );

		await user.click( screen.getByRole( 'button', { name: 'Change' } ) );

		expect( pickPosts ).toHaveBeenCalledWith(
			expect.objectContaining( {
				postType: [ 'post', 'page' ],
				value: [ 42 ],
			} )
		);
	} );

	it( 'attaches the media to the chosen post', async () => {
		const user = userEvent.setup();
		const { onChange } = renderEdit( UNATTACHED_ITEM, [
			{
				id: 7,
				type: 'post',
				link: 'https://example.com/hello',
				title: { raw: 'Hello', rendered: 'Hello' },
			},
		] );

		await user.click( screen.getByRole( 'button', { name: 'Attach' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			post: 7,
			_embedded: {
				'wp:attached-to': [
					{
						id: 7,
						type: 'post',
						link: 'https://example.com/hello',
						title: { raw: 'Hello', rendered: 'Hello' },
					},
				],
			},
		} );
	} );

	it( 'leaves the media unchanged when the picker is dismissed', async () => {
		const user = userEvent.setup();
		const { onChange } = renderEdit( ATTACHED_ITEM, null );

		await user.click( screen.getByRole( 'button', { name: 'Change' } ) );

		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
