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
export function init() {
	// wp_user_taxonomy → registered taxonomies list. Invalidate only the
	// individual `root/taxonomy` record matching the source slug; the list
	// resolver is invalidated broadly by the dispatcher.
	unlock( dispatch( coreStore ) ).registerEntityDependency(
		{ kind: 'postType', name: TAXONOMY_ENTITY },
		{ kind: 'root', name: 'taxonomy' },
		{
			shouldInvalidate: (
				prev: { slug?: string } | undefined,
				next: { slug?: string } | undefined
			) => {
				const slug = next?.slug ?? prev?.slug;
				return slug ? { records: [ slug ] } : true;
			},
		}
	);
	// wp_user_taxonomy → user post types.
	// `object_type` is a top-level REST field; the form's
	// `config.object_type` is a client-side reshape.
	unlock( dispatch( coreStore ) ).registerEntityDependency(
		{ kind: 'postType', name: TAXONOMY_ENTITY },
		{ kind: 'postType', name: POST_TYPE_ENTITY },
		{
			shouldInvalidate: (
				prev: { object_type?: string[] } | undefined,
				next: { object_type?: string[] } | undefined
			) => setsDiffer( prev?.object_type, next?.object_type ),
		}
	);
	// wp_user_post_type → registered post types list. Targeted by slug, same
	// shape as the taxonomy coupling above.
	unlock( dispatch( coreStore ) ).registerEntityDependency(
		{ kind: 'postType', name: POST_TYPE_ENTITY },
		{ kind: 'root', name: 'postType' },
		{
			shouldInvalidate: (
				prev: { slug?: string } | undefined,
				next: { slug?: string } | undefined
			) => {
				const slug = next?.slug ?? prev?.slug;
				return slug ? { records: [ slug ] } : true;
			},
		}
	);
	// wp_user_post_type → user taxonomies.
	unlock( dispatch( coreStore ) ).registerEntityDependency(
		{ kind: 'postType', name: POST_TYPE_ENTITY },
		{ kind: 'postType', name: TAXONOMY_ENTITY },
		{
			shouldInvalidate: (
				prev: { config?: { taxonomies?: string[] } } | undefined,
				next: { config?: { taxonomies?: string[] } } | undefined
			) =>
				setsDiffer(
					prev?.config?.taxonomies,
					next?.config?.taxonomies
				),
		}
	);
}
