/**
 * External dependencies
 */
import { escape as escapeString, find, get, uniqBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { FormTokenField, withFilters } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unescapeString, unescapeTerm, unescapeTerms } from '../../utils/terms';
import MostUsedTerms from './most-used-terms';

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
	orderby: 'count',
	order: 'desc',
	_fields: 'id,name',
	context: 'view',
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

function FlatTermSelector( { slug } ) {
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );

	const {
		terms,
		termIds,
		taxonomy,
		isLoading,
		hasAssignAction,
		hasCreateAction,
	} = useSelect(
		( select ) => {
			const { getCurrentPost, getEditedPostAttribute } = select(
				editorStore
			);
			const { getEntityRecords, getTaxonomy, isResolving } = select(
				coreStore
			);
			const _taxonomy = getTaxonomy( slug );
			const _termIds = _taxonomy
				? getEditedPostAttribute( _taxonomy.rest_base )
				: EMPTY_ARRAY;

			const query = {
				...DEFAULT_QUERY,
				include: _termIds,
				per_page: _termIds.length,
			};

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
				taxonomy: _taxonomy,
				termIds: _termIds,
				terms: _termIds.length
					? getEntityRecords( 'taxonomy', slug, query )
					: EMPTY_ARRAY,
				isLoading: isResolving( 'getEntityRecords', [
					'taxonomy',
					slug,
					query,
				] ),
			};
		},
		[ slug ]
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
		[ search ]
	);

	const { editPost } = useDispatch( editorStore );

	if ( ! hasAssignAction ) {
		return null;
	}

	// The getEntityRecords returns null when items are unknown.
	// This is the reason for the extra check and empty fallback array.
	const values =
		terms?.map( ( term ) => unescapeString( term.name ) ) || EMPTY_ARRAY;
	const suggestions =
		searchResults?.map( ( term ) => unescapeString( term.name ) ) ||
		EMPTY_ARRAY;

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

		if ( ! hasCreateAction ) {
			return;
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
				value={ values }
				suggestions={ suggestions }
				onChange={ onChange }
				onInputChange={ debouncedSearch }
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

export default withFilters( 'editor.PostTaxonomyType' )( FlatTermSelector );
