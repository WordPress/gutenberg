import { describe, expect, it, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import page from '../page';
import { unlock } from '../lock-unlock';

// The editor store loads the viewport store, which reads the media queries.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'page', () => {
	it( 'maps the id of each page action to its JavaScript parts', () => {
		expect( Object.keys( page ) ).toEqual( [
			'quick-edit',
			'set-as-homepage',
			'set-as-posts-page',
		] );
		for ( const parts of Object.values( page ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'callback' in parts || 'RenderModal' in parts ).toBe(
				true
			);
		}
	} );

	describe( 'quick-edit', () => {
		const post = {
			id: 1,
			type: 'page',
			status: 'draft' as const,
			title: 'About',
			content: '',
		};
		const action = page[ 'quick-edit' ];
		const { isEligible } = action;
		const callback = 'callback' in action ? action.callback : undefined;

		function createRegistryWithEditor() {
			const registry = createRegistry();
			registry.register( editorStore );
			return registry;
		}

		it( 'offers to quick edit the pages that are not in the trash', () => {
			expect( isEligible?.( post ) ).toBe( true );
			expect( isEligible?.( { ...post, status: 'trash' } ) ).toBe(
				false
			);
		} );

		it( 'labels the action by the number of pages', () => {
			const label = action.label as (
				items: ( typeof post )[]
			) => string;
			expect( label( [ post ] ) ).toBe( 'Quick edit' );
			expect( label( [ post, { ...post, id: 2 } ] ) ).toBe( 'Bulk edit' );
		} );

		it( 'opens the quick edit form with the opener of the screen', () => {
			const registry = createRegistryWithEditor();
			const opener = vi.fn();
			unlock( registry.dispatch( editorStore ) ).setQuickEditOpener(
				opener
			);

			callback?.( [ post, { ...post, id: 2 } ], { registry } );

			expect( opener ).toHaveBeenCalledTimes( 1 );
			expect( opener ).toHaveBeenCalledWith( {
				postType: 'page',
				postIds: [ 1, 2 ],
			} );
		} );

		it( 'does nothing when the screen sets no opener', () => {
			const registry = createRegistryWithEditor();

			expect( () => callback?.( [ post ], { registry } ) ).not.toThrow();
		} );
	} );

	it.each( [
		[ 'set-as-homepage', 'wp:action-set-homepage' ],
		[ 'set-as-posts-page', 'wp:action-set-posts-page' ],
	] as const )(
		'offers %s for the published pages with the %s link',
		( id, rel ) => {
			const post = {
				id: 1,
				type: 'page',
				status: 'publish' as const,
				title: 'About',
				content: '',
				_links: { [ rel ]: [ { href: 'https://example.org/1' } ] },
			};
			const { isEligible } = page[ id ];

			expect( isEligible?.( post ) ).toBe( true );
			// The server leaves the link out for the homepage, the posts
			// page, and the users who cannot manage the site options.
			expect( isEligible?.( { ...post, _links: {} } ) ).toBe( false );
			// The editor shows the actions of the edited page.
			expect( isEligible?.( { ...post, status: 'draft' } ) ).toBe(
				false
			);
		}
	);

	it( 'checks the link of each action only', () => {
		const post = {
			id: 1,
			type: 'page',
			status: 'publish' as const,
			title: 'About',
			content: '',
			_links: {
				'wp:action-set-posts-page': [
					{ href: 'https://example.org/1' },
				],
			},
		};

		expect( page[ 'set-as-homepage' ].isEligible?.( post ) ).toBe( false );
		expect( page[ 'set-as-posts-page' ].isEligible?.( post ) ).toBe( true );
	} );
} );
