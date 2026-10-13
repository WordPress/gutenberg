import { describe, expect, it, vi } from 'vitest';
import { lock } from '../../../lock-unlock';
import { registerPostTypeSchema } from '../../../dataviews/store/private-actions';
import { setAsHomepage } from '../set-as-homepage';
import { setAsPostsPage } from '../set-as-posts-page';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const PAGE = { id: 10, type: 'page', status: 'publish', title: 'About' };

/**
 * Creates a registry whose core store has the given site settings and the
 * given template as the one the `front-page` slug resolves to.
 *
 * @param {Object} options                   The data of the core store.
 * @param {Object} options.siteSettings      The site settings.
 * @param {Object} options.frontPageTemplate The template `front-page` resolves to.
 * @return {Object} The registry.
 */
function createRegistry( {
	siteSettings = { page_on_front: 1, page_for_posts: 2 },
	frontPageTemplate,
} = {} ) {
	return {
		select: () => ( {
			getEntityRecord: ( kind, name, key ) => {
				if ( kind === 'root' && name === 'site' ) {
					return siteSettings;
				}
				if ( name === 'wp_template' && key === frontPageTemplate?.id ) {
					return frontPageTemplate;
				}
			},
			getDefaultTemplateId: () => frontPageTemplate?.id,
		} ),
	};
}

describe.each( [ setAsHomepage, setAsPostsPage ] )( '$id', ( action ) => {
	it( 'is eligible for a published page', () => {
		expect(
			action.isEligible( PAGE, { registry: createRegistry() } )
		).toBe( true );
	} );

	it( 'is not eligible for a page that is not published', () => {
		expect(
			action.isEligible(
				{ ...PAGE, status: 'draft' },
				{ registry: createRegistry() }
			)
		).toBe( false );
	} );

	it( 'is not eligible for other post types', () => {
		expect(
			action.isEligible(
				{ ...PAGE, type: 'post' },
				{ registry: createRegistry() }
			)
		).toBe( false );
	} );

	it( 'is not eligible for the homepage or the posts page', () => {
		expect(
			action.isEligible( PAGE, {
				registry: createRegistry( {
					siteSettings: { page_on_front: PAGE.id, page_for_posts: 2 },
				} ),
			} )
		).toBe( false );
		expect(
			action.isEligible( PAGE, {
				registry: createRegistry( {
					siteSettings: { page_on_front: 1, page_for_posts: PAGE.id },
				} ),
			} )
		).toBe( false );
	} );

	it( 'is not eligible when the theme has a front page template', () => {
		expect(
			action.isEligible( PAGE, {
				registry: createRegistry( {
					frontPageTemplate: {
						id: 'theme//front-page',
						slug: 'front-page',
					},
				} ),
			} )
		).toBe( false );
		// The `front-page` slug can resolve to another template, e.g. `home`.
		expect(
			action.isEligible( PAGE, {
				registry: createRegistry( {
					frontPageTemplate: { id: 'theme//home', slug: 'home' },
				} ),
			} )
		).toBe( true );
	} );

	it( 'is not eligible without the registry', () => {
		expect( action.isEligible( PAGE ) ).toBe( false );
	} );
} );

describe( 'registerPostTypeSchema', () => {
	const POST_TYPES = {
		page: {
			slug: 'page',
			viewable: true,
			supports: { title: true, editor: true, 'page-attributes': true },
		},
		post: {
			slug: 'post',
			viewable: true,
			supports: { title: true, editor: true },
		},
	};

	/**
	 * Runs `registerPostTypeSchema()` against a registry that resolves the
	 * post type and the permissions of the user.
	 *
	 * @param {string}  postType              The post type.
	 * @param {boolean} canUpdateSiteSettings Whether the user can update the site settings.
	 * @return {Promise<Object>} The registered actions, and the `canUser` mock.
	 */
	async function register( postType, canUpdateSiteSettings ) {
		const actions = [];
		const editorSelectors = { getEditorSettings: () => ( {} ) };
		lock( editorSelectors, { isEntityReady: () => false } );
		const editorActions = {};
		lock( editorActions, {
			setIsReady: () => {},
			registerEntityAction: ( kind, name, action ) =>
				actions.push( action ),
			registerEntityField: () => {},
		} );
		const canUser = vi.fn( async ( operation, resource ) =>
			resource.kind === 'root' ? canUpdateSiteSettings : true
		);
		const registry = {
			select: () => editorSelectors,
			dispatch: () => editorActions,
			resolveSelect: () => ( {
				getPostType: async () => POST_TYPES[ postType ],
				canUser,
				getCurrentTheme: async () => ( { is_block_theme: true } ),
			} ),
			batch: ( callback ) => callback(),
		};
		await registerPostTypeSchema( postType )( { registry } );
		return { actions, canUser };
	}

	it( 'registers the homepage actions of pages for users who can update the site settings', async () => {
		const { actions, canUser } = await register( 'page', true );

		expect( actions ).toContain( setAsHomepage );
		expect( actions ).toContain( setAsPostsPage );
		expect( canUser ).toHaveBeenCalledWith( 'update', {
			kind: 'root',
			name: 'site',
		} );
	} );

	it( 'does not register the homepage actions for users who cannot update the site settings', async () => {
		const { actions } = await register( 'page', false );

		expect( actions ).not.toContain( setAsHomepage );
		expect( actions ).not.toContain( setAsPostsPage );
	} );

	it( 'does not register the homepage actions for other post types', async () => {
		const { actions, canUser } = await register( 'post', true );

		expect( actions ).not.toContain( setAsHomepage );
		expect( actions ).not.toContain( setAsPostsPage );
		expect( canUser ).not.toHaveBeenCalledWith( 'update', {
			kind: 'root',
			name: 'site',
		} );
	} );
} );
