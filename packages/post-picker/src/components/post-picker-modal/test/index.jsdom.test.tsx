import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import PostPickerModal from '../index';
import type { PostPickerModalProps } from '../index';

globalThis.wpVitest.mockMatchMedia();

globalThis.wpVitest.mockResizeObserver();

vi.mock( import( '@wordpress/core-data' ), () => {
	return {
		useEntityRecords: vi.fn(),
		store: { name: 'core' },
	} as unknown as typeof import( '@wordpress/core-data' );
} );

const POST_TYPES = [
	{ slug: 'post', hierarchical: false, labels: { singular_name: 'Post' } },
	{ slug: 'page', hierarchical: true, labels: { singular_name: 'Page' } },
];

const PAGES = [
	{
		id: 1,
		type: 'page',
		title: { raw: 'About', rendered: 'About' },
		date: '2026-01-01T00:00:00',
	},
	{
		id: 2,
		type: 'page',
		title: { raw: 'Contact', rendered: 'Contact' },
		date: '2026-01-02T00:00:00',
	},
];

function renderModal( props: Partial< PostPickerModalProps > = {} ) {
	const registry = createRegistry();
	registry.registerStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getPostTypes: () => POST_TYPES,
			getEntityRecords: (
				state: unknown,
				kind: string,
				name: string,
				query: { include?: number[] }
			) => PAGES.filter( ( page ) => query.include?.includes( page.id ) ),
		},
	} );

	const onSelect = vi.fn();
	const onClose = vi.fn();
	render(
		<RegistryProvider value={ registry }>
			<PostPickerModal
				postType="page"
				onSelect={ onSelect }
				onClose={ onClose }
				{ ...props }
			/>
		</RegistryProvider>
	);
	return { onSelect, onClose };
}

describe( 'PostPickerModal', () => {
	beforeEach( () => {
		vi.mocked( useEntityRecords ).mockReturnValue( {
			records: PAGES,
			isResolving: false,
			hasResolved: true,
			status: 'SUCCESS',
			totalItems: PAGES.length,
			totalPages: 1,
		} as unknown as ReturnType< typeof useEntityRecords > );
	} );

	afterEach( () => {
		vi.clearAllMocks();
		// The popover fallback container is appended to `document.body`,
		// outside the tree Testing Library cleans up.
		/* eslint-disable testing-library/no-node-access */
		document
			.querySelectorAll( '.components-popover__fallback-container' )
			.forEach( ( node ) => node.remove() );
		/* eslint-enable testing-library/no-node-access */
	} );

	it( 'lists posts of the requested post type', async () => {
		renderModal( { query: { exclude: [ 3 ] } } );

		const listbox = await screen.findByRole( 'listbox' );
		expect(
			within( listbox ).getByRole( 'option', { name: /About/ } )
		).toBeVisible();
		expect(
			within( listbox ).getByRole( 'option', { name: /Contact/ } )
		).toBeVisible();
		expect( useEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'page',
			expect.objectContaining( { exclude: [ 3 ] } )
		);
	} );

	it( 'calls onSelect with the selected post', async () => {
		const user = userEvent.setup();
		const { onSelect } = renderModal();

		const listbox = await screen.findByRole( 'listbox' );
		await user.click(
			within( listbox ).getByRole( 'option', { name: /Contact/ } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		await waitFor( () =>
			expect( onSelect ).toHaveBeenCalledWith( [ PAGES[ 1 ] ] )
		);
		expect( console ).toHaveWarnedWith(
			'A composite widget with `virtualFocus` enabled requires a focusable composite element. Set the `focusable` prop to `true` or the `virtualFocus` option to `false`.'
		);
	} );

	it( 'shows the value as selected', async () => {
		renderModal( { value: [ 1 ] } );

		const listbox = await screen.findByRole( 'listbox' );
		expect(
			within( listbox ).getByRole( 'option', { name: /About/ } )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );

	it( 'uses the title and select label', async () => {
		renderModal( {
			title: 'Choose parent page',
			selectLabel: 'Set parent',
		} );

		await screen.findByRole( 'listbox' );
		expect(
			screen.getByRole( 'dialog', { name: 'Choose parent page' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Set parent' } )
		).toBeVisible();
	} );

	it( 'shows a post type control when given several post types', async () => {
		renderModal( { postType: [ 'page', 'post' ] } );

		await screen.findByRole( 'listbox' );
		expect( screen.getByText( 'Content type' ) ).toBeVisible();
	} );

	it( 'does not show a post type control for a single post type', async () => {
		renderModal();

		await screen.findByRole( 'listbox' );
		expect( screen.queryByText( 'Content type' ) ).not.toBeInTheDocument();
	} );
} );
