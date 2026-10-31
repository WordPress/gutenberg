import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { unlock } from '../lock-unlock';

/*
 * Post types that are never the queried object of a frontend request, so no
 * request of theirs runs the template hierarchy and asking which template they
 * render inside falls through to an unrelated one — ultimately `index`.
 * Template parts and patterns do appear inside templates, but in many of them,
 * and never as the thing being queried.
 *
 * `wp_template` is never queried either, but is answered before this list is
 * consulted: the template being edited is its own answer.
 *
 * The site editor guards the same resolution in `use-resolve-edited-entity`,
 * over a longer list that also reflects which entities that editor opens.
 */
const NEVER_QUERIED_POST_TYPES = [
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

/**
 * This is a React hook that provides the ID of the template an entity renders
 * inside, matching the template WordPress would choose for it on the frontend.
 *
 * @param props          The props object.
 * @param props.postType The post type of the edited entity.
 * @param props.postId   The ID of the edited entity.
 * @return The template ID, or `undefined` when there is no template to resolve.
 */
export function useTemplateId( {
	postType,
	postId,
}: {
	postType?: string;
	postId?: string;
} = {} ) {
	return useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return undefined;
			}

			if ( postType === 'wp_template' ) {
				return postId;
			}

			if ( NEVER_QUERIED_POST_TYPES.includes( postType ) ) {
				return undefined;
			}

			return unlock( select( coreDataStore ) ).getTemplateId(
				postType,
				postId
			);
		},
		[ postType, postId ]
	);
}
