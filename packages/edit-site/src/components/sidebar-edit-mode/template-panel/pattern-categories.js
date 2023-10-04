/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { FormTokenField, FlexBlock, PanelRow } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES } from '../../../utils/constants';

export const unescapeString = ( arg ) => {
	return decodeEntities( arg );
};

/**
 * Returns a term object with name unescaped.
 *
 * @param {Object} term The term object to unescape.
 *
 * @return {Object} Term object with name property unescaped.
 */
export const unescapeTerm = ( term ) => {
	return {
		...term,
		name: unescapeString( term.name ),
	};
};

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array<any>}
 */
const EMPTY_ARRAY = [];

/**
 * Module constants
 */
const MAX_TERMS_SUGGESTIONS = 20;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	_fields: 'id,name',
	context: 'view',
};

const isSameTermName = ( termA, termB ) =>
	unescapeString( termA ).toLowerCase() ===
	unescapeString( termB ).toLowerCase();

const termNamesToIds = ( names, terms ) => {
	return names.map(
		( termName ) =>
			terms.find( ( term ) => isSameTermName( term.name, termName ) ).id
	);
};

export default function PatternCategories( { post } ) {
	const slug = 'wp_pattern_category';
	const [ values, setValues ] = useState( [] );
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );

	const {
		terms,
		taxonomy,
		hasAssignAction,
		hasCreateAction,
		hasResolvedTerms,
	} = useSelect(
		( select ) => {
			const { getEntityRecords, getTaxonomy, hasFinishedResolution } =
				select( coreStore );
			const _taxonomy = getTaxonomy( slug );
			const _termIds =
				post?.wp_pattern_category?.length > 0
					? post?.wp_pattern_category
					: EMPTY_ARRAY;
			const query = {
				...DEFAULT_QUERY,
				include: _termIds?.join( ',' ),
				per_page: -1,
			};

			return {
				hasCreateAction: _taxonomy
					? post._links?.[
							'wp:action-create-' + _taxonomy.rest_base
					  ] ?? false
					: false,
				hasAssignAction: _taxonomy
					? post._links?.[
							'wp:action-assign-' + _taxonomy.rest_base
					  ] ?? false
					: false,
				taxonomy: _taxonomy,
				termIds: _termIds,
				terms: _termIds?.length
					? getEntityRecords( 'taxonomy', slug, query )
					: EMPTY_ARRAY,
				hasResolvedTerms: hasFinishedResolution( 'getEntityRecords', [
					'taxonomy',
					slug,
					query,
				] ),
			};
		},
		[ slug, post ]
	);

	const { searchResults } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );

			return {
				searchResults: !! search
					? getEntityRecords( 'taxonomy', slug, {
							...DEFAULT_QUERY,
							search,
					  } )
					: EMPTY_ARRAY,
			};
		},
		[ search, slug ]
	);

	// Update terms state only after the selectors are resolved.
	// We're using this to avoid terms temporarily disappearing on slow networks
	// while core data makes REST API requests.
	useEffect( () => {
		if ( hasResolvedTerms ) {
			const newValues = ( terms ?? [] ).map( ( term ) =>
				unescapeString( term.name )
			);

			setValues( newValues );
		}
	}, [ terms, hasResolvedTerms ] );

	const suggestions = useMemo( () => {
		return ( searchResults ?? [] ).map( ( term ) =>
			unescapeString( term.name )
		);
	}, [ searchResults ] );

	const { saveEntityRecord, editEntityRecord, invalidateResolution } =
		useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	if ( ! hasAssignAction ) {
		return null;
	}

	async function findOrCreateTerm( term ) {
		try {
			const newTerm = await saveEntityRecord( 'taxonomy', slug, term, {
				throwOnError: true,
			} );
			invalidateResolution( 'getUserPatternCategories' );
			return unescapeTerm( newTerm );
		} catch ( error ) {
			if ( error.code !== 'term_exists' ) {
				throw error;
			}

			return {
				id: error.data.term_id,
				name: term.name,
			};
		}
	}

	function onUpdateTerms( newTermIds ) {
		editEntityRecord( 'postType', PATTERN_TYPES.user, post.id, {
			wp_pattern_category: newTermIds,
		} );
	}

	function onChange( termNames ) {
		const availableTerms = [
			...( terms ?? [] ),
			...( searchResults ?? [] ),
		];
		const uniqueTerms = termNames.reduce( ( acc, name ) => {
			if (
				! acc.some( ( n ) => n.toLowerCase() === name.toLowerCase() )
			) {
				acc.push( name );
			}
			return acc;
		}, [] );

		const newTermNames = uniqueTerms.filter(
			( termName ) =>
				! availableTerms.find( ( term ) =>
					isSameTermName( term.name, termName )
				)
		);

		// Optimistically update term values.
		// The selector will always re-fetch terms later.
		setValues( uniqueTerms );

		if ( newTermNames.length === 0 ) {
			return onUpdateTerms(
				termNamesToIds( uniqueTerms, availableTerms )
			);
		}

		if ( ! hasCreateAction ) {
			return;
		}

		Promise.all(
			newTermNames.map( ( termName ) =>
				findOrCreateTerm( { name: termName } )
			)
		)
			.then( ( newTerms ) => {
				const newAvailableTerms = availableTerms.concat( newTerms );
				return onUpdateTerms(
					termNamesToIds( uniqueTerms, newAvailableTerms )
				);
			} )
			.catch( ( error ) => {
				createErrorNotice( error.message, {
					type: 'snackbar',
				} );
			} );
	}

	const singularName =
		taxonomy?.labels?.singular_name ??
		( slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' ) );
	const termAddedLabel = sprintf(
		/* translators: %s: term name. */
		_x( '%s added', 'term' ),
		singularName
	);
	const termRemovedLabel = sprintf(
		/* translators: %s: term name. */
		_x( '%s removed', 'term' ),
		singularName
	);
	const removeTermLabel = sprintf(
		/* translators: %s: term name. */
		_x( 'Remove %s', 'term' ),
		singularName
	);

	return (
		<PanelRow initialOpen={ true } title={ __( 'Categories' ) }>
			<FlexBlock>
				<FormTokenField
					__next40pxDefaultSize
					value={ values }
					suggestions={ suggestions }
					onChange={ onChange }
					onInputChange={ debouncedSearch }
					maxSuggestions={ MAX_TERMS_SUGGESTIONS }
					label={ __( 'Pattern categories' ) }
					messages={ {
						added: termAddedLabel,
						removed: termRemovedLabel,
						remove: removeTermLabel,
					} }
					tokenizeOnBlur
				/>
			</FlexBlock>
		</PanelRow>
	);
}
