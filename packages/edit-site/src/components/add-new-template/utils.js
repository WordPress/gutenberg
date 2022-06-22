/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useMemo } from '@wordpress/element';

export const usePostTypes = () => {
	const postTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		const excludedPostTypes = [ 'attachment', 'page' ];
		return postTypes?.filter(
			( { viewable, slug } ) =>
				viewable && ! excludedPostTypes.includes( slug )
		);
	}, [ postTypes ] );
};

/**
 * @typedef {Object} PostTypeEntitiesInfo
 * @property {boolean}  hasEntities   If a postType has available entities.
 * @property {number[]} existingPosts An array of the existing entities ids.
 */

/**
 * Helper hook that returns information about a post type having
 * posts that we can create a specific template for.
 *
 * First we need to find the existing posts with an associated template,
 * to query afterwards for any remaing post, by excluding them.
 *
 * @param {string[]} existingTemplates The existing templates.
 * @return {Record<string,PostTypeEntitiesInfo>} An object with the postTypes as `keys` and PostTypeEntitiesInfo as values.
 */
export const usePostTypesEntitiesInfo = ( existingTemplates ) => {
	const postTypes = usePostTypes();
	const slugsToExcludePerEntity = useMemo( () => {
		return postTypes?.reduce( ( accumulator, _postType ) => {
			const slugsWithTemplates = ( existingTemplates || [] ).reduce(
				( _accumulator, existingTemplate ) => {
					const prefix = `single-${ _postType.slug }-`;
					if ( existingTemplate.slug.startsWith( prefix ) ) {
						_accumulator.push(
							existingTemplate.slug.substring( prefix.length )
						);
					}
					return _accumulator;
				},
				[]
			);
			if ( slugsWithTemplates.length ) {
				accumulator[ _postType.slug ] = slugsWithTemplates;
			}
			return accumulator;
		}, {} );
	}, [ postTypes, existingTemplates ] );
	const postsToExcludePerEntity = useSelect(
		( select ) => {
			if ( ! slugsToExcludePerEntity ) {
				return;
			}
			const postsToExclude = Object.entries(
				slugsToExcludePerEntity
			).reduce( ( accumulator, [ slug, slugsWithTemplates ] ) => {
				const postsWithTemplates = select( coreStore ).getEntityRecords(
					'postType',
					slug,
					{
						_fields: 'id',
						context: 'view',
						slug: slugsWithTemplates,
					}
				);
				if ( postsWithTemplates?.length ) {
					accumulator[ slug ] = postsWithTemplates;
				}
				return accumulator;
			}, {} );
			return postsToExclude;
		},
		[ slugsToExcludePerEntity ]
	);
	const entitiesInfo = useSelect(
		( select ) => {
			return postTypes?.reduce( ( accumulator, { slug } ) => {
				const existingPosts =
					postsToExcludePerEntity?.[ slug ]?.map(
						( { id } ) => id
					) || [];
				accumulator[ slug ] = {
					hasEntities: !! select( coreStore ).getEntityRecords(
						'postType',
						slug,
						{
							per_page: 1,
							_fields: 'id',
							context: 'view',
							exclude: existingPosts,
						}
					)?.length,
					existingPosts,
				};
				return accumulator;
			}, {} );
		},
		[ postTypes, postsToExcludePerEntity ]
	);
	return entitiesInfo;
};

export const mapToIHasNameAndId = ( entities, path ) => {
	return ( entities || [] ).map( ( entity ) => ( {
		...entity,
		name: decodeEntities( get( entity, path ) ),
	} ) );
};
