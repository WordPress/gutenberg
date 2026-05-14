/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { isShallowEqual } from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { POST_TYPE_ENTITY, TAXONOMY_ENTITY } from './constants';
import { unlock } from './lock-unlock';

function setsDiffer(
	a: string[] | undefined,
	b: string[] | undefined
): boolean {
	return ! isShallowEqual(
		[ ...( a ?? [] ) ].sort(),
		[ ...( b ?? [] ) ].sort()
	);
}

/**
 * One-shot bootstrap invoked by `@wordpress/boot` per the `init` array in
 * this package's `wpPlugin.pages` entry. Declares the cross-entity couplings
 * the cache layer can't infer: `/wp/v2/taxonomies` and `/wp/v2/types` are
 * derived from the `wp_user_taxonomy` / `wp_user_post_type` CPTs at PHP
 * `init` priority 20, and the two CPTs cross-reference each other.
 */
export async function init() {
	const { updateEntityConfig } = unlock( dispatch( coreStore ) );

	await Promise.all( [
		// wp_user_taxonomy invalidates:
		//   - root/taxonomy: targeted by slug; the singular `getTaxonomy(slug)`
		//     resolver is invalidated by key, and the list resolver
		//     (`getTaxonomies`) broadly.
		//   - postType/wp_user_post_type: when `object_type` changes the set of
		//     post types this taxonomy applies to.
		updateEntityConfig( 'postType', TAXONOMY_ENTITY, {
			invalidates: [
				{
					target: { kind: 'root', name: 'taxonomy' },
					shouldInvalidate: (
						prev: { slug?: string } | undefined,
						next: { slug?: string } | undefined
					) => {
						const slug = next?.slug ?? prev?.slug;
						return slug ? { records: [ slug ] } : true;
					},
				},
				{
					target: { kind: 'postType', name: POST_TYPE_ENTITY },
					// `object_type` is a top-level REST field; the form's
					// `config.object_type` is a client-side reshape.
					shouldInvalidate: (
						prev: { object_type?: string[] } | undefined,
						next: { object_type?: string[] } | undefined
					) => setsDiffer( prev?.object_type, next?.object_type ),
				},
			],
		} ),

		// wp_user_post_type invalidates:
		//   - root/postType: targeted by slug, same shape as the taxonomy
		//     coupling above.
		//   - postType/wp_user_taxonomy: when `config.taxonomies` changes.
		updateEntityConfig( 'postType', POST_TYPE_ENTITY, {
			invalidates: [
				{
					target: { kind: 'root', name: 'postType' },
					shouldInvalidate: (
						prev: { slug?: string } | undefined,
						next: { slug?: string } | undefined
					) => {
						const slug = next?.slug ?? prev?.slug;
						return slug ? { records: [ slug ] } : true;
					},
				},
				{
					target: { kind: 'postType', name: TAXONOMY_ENTITY },
					shouldInvalidate: (
						prev:
							| { config?: { taxonomies?: string[] } }
							| undefined,
						next: { config?: { taxonomies?: string[] } } | undefined
					) =>
						setsDiffer(
							prev?.config?.taxonomies,
							next?.config?.taxonomies
						),
				},
			],
		} ),
	] );
}
