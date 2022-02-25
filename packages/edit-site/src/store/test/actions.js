/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '..';

jest.useRealTimers();

const ENTITY_TYPES = {
	wp_template: {
		description: 'Templates to include in your theme.',
		hierarchical: false,
		name: 'Templates',
		rest_base: 'templates',
		rest_namespace: 'wp/v2',
		slug: 'wp_template',
		taxonomies: [],
	},
};

function createRegistryWithStores() {
	// create a registry
	const registry = createRegistry();

	// register stores
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editSiteStore );
	registry.register( interfaceStore );
	registry.register( noticesStore );

	return registry;
}

describe( 'actions', () => {
	describe( 'toggleFeature', () => {
		it( 'should toggle a feature flag', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editSiteStore ).toggleFeature( 'name' );
			expect(
				registry.select( editSiteStore ).isFeatureActive( 'name' )
			).toBe( true );
		} );
	} );

	describe( 'setTemplate', () => {
		const ID = 1;
		const SLUG = 'archive';

		it( 'should set the template when slug is provided', async () => {
			const registry = createRegistryWithStores();

			await registry.dispatch( editSiteStore ).setTemplate( ID, SLUG );

			const select = registry.select( editSiteStore );
			expect( select.getEditedPostId() ).toBe( ID );
			expect( select.getPage().context.templateSlug ).toBe( SLUG );
		} );

		it( 'should set the template by fetching the template slug', async () => {
			const registry = createRegistryWithStores();

			apiFetch.setFetchHandler( async ( options ) => {
				const { method = 'GET', path } = options;
				if ( method === 'GET' ) {
					if ( path.startsWith( '/wp/v2/types' ) ) {
						return ENTITY_TYPES;
					}

					if ( path.startsWith( `/wp/v2/templates/${ ID }` ) ) {
						return { id: ID, slug: SLUG };
					}
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			await registry.dispatch( editSiteStore ).setTemplate( ID );

			const select = registry.select( editSiteStore );
			expect( select.getEditedPostId() ).toBe( ID );
			expect( select.getPage().context.templateSlug ).toBe( SLUG );
		} );
	} );

	describe( 'addTemplate', () => {
		it( 'should issue a REST request to create the template and then set it', async () => {
			const registry = createRegistryWithStores();

			const ID = 1;
			const SLUG = 'index';

			apiFetch.setFetchHandler( async ( options ) => {
				const { method = 'GET', path, data } = options;

				if ( method === 'GET' && path.startsWith( '/wp/v2/types' ) ) {
					return ENTITY_TYPES;
				}

				if (
					method === 'POST' &&
					path.startsWith( '/wp/v2/templates' )
				) {
					return { id: ID, slug: data.slug };
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			await registry
				.dispatch( editSiteStore )
				.addTemplate( { slug: SLUG } );

			const select = registry.select( editSiteStore );
			expect( select.getEditedPostId() ).toBe( ID );
			expect( select.getPage().context.templateSlug ).toBe( SLUG );
		} );
	} );

	describe( 'setTemplatePart', () => {
		it( 'should set template part', () => {
			const registry = createRegistryWithStores();

			const ID = 1;
			registry.dispatch( editSiteStore ).setTemplatePart( ID );

			const select = registry.select( editSiteStore );
			expect( select.getEditedPostId() ).toBe( ID );
			expect( select.getEditedPostType() ).toBe( 'wp_template_part' );
		} );
	} );

	describe( 'setPage', () => {
		it( 'should find the template and then set the page', async () => {
			const registry = createRegistryWithStores();

			const ID = 'emptytheme//single';
			const SLUG = 'single';

			window.fetch = async ( path ) => {
				if ( path === '/?_wp-find-template=true' ) {
					return {
						json: async () => ( { data: { id: ID, slug: SLUG } } ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ path }`,
				};
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { method = 'GET', path } = options;

				if ( method === 'GET' ) {
					if ( path.startsWith( '/wp/v2/types' ) ) {
						return ENTITY_TYPES;
					}

					if ( path.startsWith( `/wp/v2/templates/${ ID }` ) ) {
						return { id: ID, slug: SLUG };
					}
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			await registry.dispatch( editSiteStore ).setPage( { path: '/' } );

			const select = registry.select( editSiteStore );
			expect( select.getEditedPostId() ).toBe( 'emptytheme//single' );
			expect( select.getEditedPostType() ).toBe( 'wp_template' );
			expect( select.getPage().path ).toBe( '/' );
		} );
	} );

	describe( 'setHomeTemplateId', () => {
		it( 'should set the home template ID', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editSiteStore ).setHomeTemplateId( 90 );
			expect( registry.select( editSiteStore ).getHomeTemplateId() ).toBe(
				90
			);
		} );
	} );

	describe( 'setIsListViewOpened', () => {
		it( 'should set the list view opened state', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editSiteStore ).setIsListViewOpened( true );
			expect( registry.select( editSiteStore ).isListViewOpened() ).toBe(
				true
			);

			registry.dispatch( editSiteStore ).setIsListViewOpened( false );
			expect( registry.select( editSiteStore ).isListViewOpened() ).toBe(
				false
			);
		} );
	} );
} );
