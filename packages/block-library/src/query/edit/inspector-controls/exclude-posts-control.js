/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getEntitiesInfo } from '../../utils';
import { MAX_SUGGESTED_POSTS } from '../../constants';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array<any>}
 */
const EMPTY_ARRAY = [];

const POSTS_QUERY = {
	per_page: -1,
	_fields: 'id,title',
};

function ExcludePostsControl( { value, onChange, query } ) {
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );
	const searchResults = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const _query = {
				...POSTS_QUERY,
				search,
				per_page: MAX_SUGGESTED_POSTS,
				order: 'asc',
				orderby: 'relevance',
				exclude: value,
			};
			return !! search
				? getEntityRecords( 'postType', query.postType, _query )?.map(
						( v ) => {
							return {
								...v,
								name: v.title.rendered,
							};
						}
				  )
				: EMPTY_ARRAY;
		},
		[ search ]
	);
	const suggestions = useMemo( () => {
		return ( searchResults ?? [] ).map( ( post ) => post.name );
	}, [ searchResults ] );

	const excludedPostsList = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const _query = {
				...POSTS_QUERY,
				include: value,
			};
			const _posts = getEntityRecords(
				'postType',
				query.postType,
				_query
			);
			const _searchResults = searchResults ?? [];
			const _excludedPosts =
				_posts?.map( ( post ) => {
					return {
						...post,
						name: post.title.rendered,
					};
				} ) ?? [];
			return _excludedPosts.concat( _searchResults );
		},
		[ searchResults ]
	);

	if ( ! excludedPostsList ) {
		return null;
	}

	const excludedPostsInfo = getEntitiesInfo( excludedPostsList );

	/**
	 * We need to normalize the value because the block operates on a
	 * comma(`,`) separated string value and `FormTokenFiels` needs an
	 * array.
	 */
	const normalizedValue = ! value ? [] : value.toString().split( ',' );
	// Returns only the existing posts ids. This prevents the component
	// from crashing in the editor, when non existing ids are provided.
	const sanitizedValue = normalizedValue.reduce( ( accumulator, postId ) => {
		const post = excludedPostsInfo.mapById[ postId ];
		if ( post ) {
			accumulator.push( {
				id: postId,
				value: post.name,
			} );
		}
		return accumulator;
	}, [] );

	const getIdByValue = ( entitiesMappedByName, postTitle ) => {
		const id = postTitle?.id || entitiesMappedByName[ postTitle ]?.id;
		if ( id ) return id;
	};

	const onExcludedPostsChange = ( newValue ) => {
		const ids = Array.from(
			newValue.reduce( ( accumulator, post ) => {
				// Verify that new values point to existing entities.
				const id = getIdByValue( excludedPostsInfo.mapByName, post );
				if ( id ) accumulator.add( id );
				return accumulator;
			}, new Set() )
		);
		onChange( { exclude: ids.join( ',' ) } );
	};

	return (
		<FormTokenField
			label={ __( 'Exclude Posts' ) }
			value={ sanitizedValue }
			suggestions={ suggestions }
			onInputChange={ debouncedSearch }
			onChange={ onExcludedPostsChange }
		/>
	);
}

export default ExcludePostsControl;
