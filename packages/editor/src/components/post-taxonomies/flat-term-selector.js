/**
 * External dependencies
 */
import { escape as escapeString, find, get, uniqBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	FormTokenField,
	withFilters,
	withSpokenMessages,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { compose, useDebounce } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unescapeString, unescapeTerm, unescapeTerms } from '../../utils/terms';
import MostUsedTerms from './most-used-terms';

/**
 * Module constants
 */
const MAX_TERMS_SUGGESTIONS = 20;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	orderby: 'count',
	order: 'desc',
	_fields: 'id,name,count',
};

const isSameTermName = ( termA, termB ) =>
	unescapeString( termA ).toLowerCase() ===
	unescapeString( termB ).toLowerCase();

const termNamesToIds = ( names, terms ) => {
	return names.map(
		( termName ) =>
			find( terms, ( term ) => isSameTermName( term.name, termName ) ).id
	);
};

// Tries to create a term or fetch it if it already exists.
function findOrCreateTerm( termName, restBase ) {
	const escpapedTermName = escapeString( termName );

	return apiFetch( {
		path: `/wp/v2/${ restBase }`,
		method: 'POST',
		data: { name: escpapedTermName },
	} )
		.catch( ( error ) => {
			const errorCode = error.code;
			if ( errorCode === 'term_exists' ) {
				// If the terms exist, fetch it instead of creating a new one.
				const addRequest = apiFetch( {
					path: addQueryArgs( `/wp/v2/${ restBase }`, {
						...DEFAULT_QUERY,
						search: escpapedTermName,
					} ),
				} ).then( unescapeTerms );

				return addRequest.then( ( searchResult ) => {
					return find( searchResult, ( result ) =>
						isSameTermName( result.name, termName )
					);
				} );
			}

			return Promise.reject( error );
		} )
		.then( unescapeTerm );
}

function FlatTermSelector( { slug, speak } ) {
	const [ search, setSearch ] = useState( '' );
	const searchTerms = useDebounce( setSearch, 500 );

	const { hasAssignAction, termIds, taxonomy } = useSelect(
		( select ) => {
			const { getCurrentPost } = select( editorStore );
			const { getTaxonomy } = select( coreStore );
			const _taxonomy = getTaxonomy( slug );

			return {
				hasCreateAction: _taxonomy
					? get(
							getCurrentPost(),
							[
								'_links',
								'wp:action-create-' + _taxonomy.rest_base,
							],
							false
					  )
					: false,
				hasAssignAction: _taxonomy
					? get(
							getCurrentPost(),
							[
								'_links',
								'wp:action-assign-' + _taxonomy.rest_base,
							],
							false
					  )
					: false,
				termIds: _taxonomy
					? select( editorStore ).getEditedPostAttribute(
							_taxonomy.rest_base
					  )
					: [],
				taxonomy: _taxonomy,
			};
		},
		[ slug ]
	);

	const { terms, isLoading } = useSelect(
		( select ) => {
			const { getEntityRecords, isResolving } = select( coreStore );

			const query = {
				...DEFAULT_QUERY,
				include: termIds.join( ',' ),
				per_page: termIds.length || 1,
			};

			return {
				terms: termIds.length
					? getEntityRecords( 'taxonomy', slug, query )
					: [],
				isLoading: isResolving( 'getEntityRecords', [
					'taxonomy',
					taxonomy.slug,
					query,
				] ),
			};
		},
		[ termIds ]
	);

	const { searchResults } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );

			return {
				searchResults:
					search.length >= 3
						? getEntityRecords( 'taxonomy', slug, {
								...DEFAULT_QUERY,
								search,
						  } )
						: [],
			};
		},
		[ search ]
	);

	const { editPost } = useDispatch( editorStore );

	// @TODO useMemo, Luke.
	const selectedTerms =
		terms?.map( ( term ) => unescapeString( term.name ) ) || [];
	const suggestions =
		searchResults?.map( ( term ) => unescapeString( term.name ) ) || [];

	if ( ! hasAssignAction ) {
		return null;
	}

	function onUpdateTerms( newTermIds ) {
		editPost( { [ taxonomy.rest_base ]: newTermIds } );
	}

	function onChange( termNames ) {
		const availableTerms = [ ...terms, ...searchResults ];
		const uniqueTerms = uniqBy( termNames, ( term ) => term.toLowerCase() );
		const newTermNames = uniqueTerms.filter(
			( termName ) =>
				! find( availableTerms, ( term ) =>
					isSameTermName( term.name, termName )
				)
		);

		if ( newTermNames.length === 0 ) {
			return onUpdateTerms(
				termNamesToIds( uniqueTerms, availableTerms )
			);
		}

		Promise.all(
			newTermNames.map( ( termName ) =>
				findOrCreateTerm( termName, taxonomy.rest_base )
			)
		).then( ( newTerms ) => {
			const newAvailableTerms = availableTerms.concat( newTerms );
			return onUpdateTerms(
				termNamesToIds( uniqueTerms, newAvailableTerms )
			);
		} );
	}

	function appendTerm( newTerm ) {
		if ( termIds.includes( newTerm.id ) ) {
			return;
		}

		const newTermIds = [ ...termIds, newTerm.id ];

		const termAddedMessage = sprintf(
			/* translators: %s: term name. */
			_x( '%s added', 'term' ),
			get(
				taxonomy,
				[ 'labels', 'singular_name' ],
				slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' )
			)
		);

		speak( termAddedMessage, 'assertive' );

		onUpdateTerms( newTermIds );
	}

	const newTermLabel = get(
		taxonomy,
		[ 'labels', 'add_new_item' ],
		slug === 'post_tag' ? __( 'Add new tag' ) : __( 'Add new Term' )
	);
	const singularName = get(
		taxonomy,
		[ 'labels', 'singular_name' ],
		slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' )
	);
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
		<>
			<FormTokenField
				value={ selectedTerms }
				suggestions={ suggestions || selectedTerms }
				onChange={ onChange }
				onInputChange={ searchTerms }
				maxSuggestions={ MAX_TERMS_SUGGESTIONS }
				disabled={ isLoading }
				label={ newTermLabel }
				messages={ {
					added: termAddedLabel,
					removed: termRemovedLabel,
					remove: removeTermLabel,
				} }
			/>
			<MostUsedTerms taxonomy={ taxonomy } onSelect={ appendTerm } />
		</>
	);
}

export default compose(
	withSpokenMessages,
	withFilters( 'editor.PostTaxonomyType' )
)( FlatTermSelector );
