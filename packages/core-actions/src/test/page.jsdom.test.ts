import { describe, expect, it } from 'vitest';
import page from '../page';
import type { BasePost } from '../shared/types';

const PAGE: BasePost = {
	id: 10,
	type: 'page',
	status: 'publish',
	title: 'About',
	content: '',
};

type CoreData = {
	siteSettings?: { page_on_front: number; page_for_posts: number };
	frontPageTemplate?: { id: string; slug: string };
};

/**
 * Creates a registry whose core store has the given site settings and the
 * given template as the one the `front-page` slug resolves to.
 *
 * @param options                   The data of the core store.
 * @param options.siteSettings      The site settings.
 * @param options.frontPageTemplate The template `front-page` resolves to.
 * @return The registry.
 */
function createRegistry( {
	siteSettings = { page_on_front: 1, page_for_posts: 2 },
	frontPageTemplate,
}: CoreData = {} ) {
	return {
		select: () => ( {
			getEntityRecord: ( kind: string, name: string, key?: string ) => {
				if ( kind === 'root' && name === 'site' ) {
					return siteSettings;
				}
				if ( name === 'wp_template' && key === frontPageTemplate?.id ) {
					return frontPageTemplate;
				}
				return undefined;
			},
			getDefaultTemplateId: () => frontPageTemplate?.id,
		} ),
	};
}

describe( 'page', () => {
	it( 'maps the id of each page action to its JavaScript parts', () => {
		expect( Object.keys( page ) ).toEqual( [
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
} );

describe.each( Object.entries( page ) )( '%s', ( id, action ) => {
	it( 'is eligible for a published page', () => {
		expect(
			action.isEligible?.( PAGE, { registry: createRegistry() } )
		).toBe( true );
	} );

	it( 'is not eligible for a page that is not published', () => {
		expect(
			action.isEligible?.(
				{ ...PAGE, status: 'draft' },
				{ registry: createRegistry() }
			)
		).toBe( false );
	} );

	it( 'is not eligible for other post types', () => {
		expect(
			action.isEligible?.(
				{ ...PAGE, type: 'post' },
				{ registry: createRegistry() }
			)
		).toBe( false );
	} );

	it( 'is not eligible for the homepage or the posts page', () => {
		expect(
			action.isEligible?.( PAGE, {
				registry: createRegistry( {
					siteSettings: { page_on_front: 10, page_for_posts: 2 },
				} ),
			} )
		).toBe( false );
		expect(
			action.isEligible?.( PAGE, {
				registry: createRegistry( {
					siteSettings: { page_on_front: 1, page_for_posts: 10 },
				} ),
			} )
		).toBe( false );
	} );

	it( 'is not eligible when the theme has a front page template', () => {
		expect(
			action.isEligible?.( PAGE, {
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
			action.isEligible?.( PAGE, {
				registry: createRegistry( {
					frontPageTemplate: { id: 'theme//home', slug: 'home' },
				} ),
			} )
		).toBe( true );
	} );

	it( 'is not eligible without the registry', () => {
		expect( action.isEligible?.( PAGE, { registry: undefined } ) ).toBe(
			false
		);
	} );
} );
