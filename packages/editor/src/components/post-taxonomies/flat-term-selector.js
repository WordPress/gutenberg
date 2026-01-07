/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState, useRef } from '@wordpress/element';
import {
	FormTokenField,
	withFilters,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unescapeString, unescapeTerm } from '../../utils/terms';
import MostUsedTerms from './most-used-terms';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array<any>}
 */
const EMPTY_ARRAY = [];

/**
 * How the max suggestions limit was chosen:
 *  - Matches the `per_page` range set by the REST API.
 *  - Can't use "unbound" query. The `FormTokenField` needs a fixed number.
 *  - Matches default for `FormTokenField`.
 */
const MAX_TERMS_SUGGESTIONS = 100;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	_fields: 'id,name',
	context: 'view',
};

const isSameTermName = ( termA, termB ) =>
	unescapeString( termA ).toLowerCase() ===
	unescapeString( termB ).toLowerCase();

const termNamesToIds = ( names, terms ) => {
	return names
		.map(
			( termName ) =>
				terms.find( ( term ) => isSameTermName( term.name, termName ) )
					?.id
		)
		.filter( ( id ) => id !== undefined );
};

/**
 * Renders a flat term selector component.
 *
 * @param {Object} props      The component props.
 * @param {string} props.slug The slug of the taxonomy.
 *
 * @return {React.ReactNode} The rendered flat term selector component.
 */
export function FlatTermSelector( { slug } ) {
	const [ values, setValues ] = useState( [] );
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );
    const requestQueue = useRef( [] );
    const isProcessing = useRef( false );
    const termsInQueue = useRef( new Set() );
    const selectedNamesRef = useRef( [] );
    const localTermCache = useRef( {} );

	const {
		terms,
		termIds,
		taxonomy,
		hasAssignAction,
		hasCreateAction,
		hasResolvedTerms,
	} = useSelect(
		( select ) => {
			const { getCurrentPost, getEditedPostAttribute } =
				select( editorStore );
			const { getEntityRecords, getEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const post = getCurrentPost();
			const _taxonomy = getEntityRecord( 'root', 'taxonomy', slug );
			const _termIds = _taxonomy
				? getEditedPostAttribute( _taxonomy.rest_base )
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
		[ search, slug ]
	);

		useEffect( () => {
		if ( isProcessing.current ) {
			return; // STOP! Don't touch the input value.
		}

		if ( hasResolvedTerms ) {
			const newValues = ( terms ?? [] ).map( ( term ) =>
				unescapeString( term.name )
			);
			setValues( newValues );
			selectedNamesRef.current = newValues;
		}
	}, [ terms, hasResolvedTerms ] );

	const suggestions = useMemo( () => {
		return ( searchResults ?? [] ).map( ( term ) =>
			unescapeString( term.name )
		);
	}, [ searchResults ] );

	const { editPost } = useDispatch( editorStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	async function findOrCreateTerm( term ) {
		try {
			const newTerm = await saveEntityRecord( 'taxonomy', slug, term, {
				throwOnError: true,
			} );
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
		editPost( { [ taxonomy.rest_base ]: newTermIds } );
	}

		function getCurrentTermIds( termNames, currentAvailableTerms ) {
		return termNames
			.map( ( name ) => {
				const found = currentAvailableTerms.find( ( t ) => isSameTermName( t.name, name ) );
				if ( found ) return found.id;
				
				const cached = localTermCache.current[ unescapeString(name).toLowerCase() ];
				if ( cached ) return cached.id;

				return undefined;
			} )
			.filter( ( id ) => id !== undefined );
	}

	async function processQueue( currentAvailableTerms ) {
		if ( isProcessing.current ) {
			return;
		}

		isProcessing.current = true;
		const lockName = 'term-creation-queue';
		lockPostSaving( lockName );

		try {
			while ( requestQueue.current.length > 0 ) {
				const termName = requestQueue.current.shift();
				
				try {
					const newTerm = await findOrCreateTerm( { name: termName } );
					localTermCache.current[ unescapeString( termName ).toLowerCase() ] = newTerm;

					const idsToSave = getCurrentTermIds( selectedNamesRef.current, currentAvailableTerms );
					onUpdateTerms( idsToSave );

				} catch ( error ) {
					if ( error.code !== 'term_exists' ) {
						createErrorNotice( error.message, { type: 'snackbar' } );
					}
				} finally {
					termsInQueue.current.delete( termName );
				}
			}
		} finally {
			isProcessing.current = false;
			unlockPostSaving( lockName );
		}
	}

		async function onChange( termNames ) {
		const availableTerms = [
			...( terms ?? [] ),
			...( searchResults ?? [] ),
		];
		const uniqueTerms = termNames.reduce( ( acc, name ) => {
			if ( ! acc.some( ( n ) => n.toLowerCase() === name.toLowerCase() ) ) {
				acc.push( name );
			}
			return acc;
		}, [] );

		setValues( uniqueTerms );
		selectedNamesRef.current = uniqueTerms;

		const newTermNames = uniqueTerms.filter(
			( termName ) =>
				! availableTerms.find( ( term ) =>
					isSameTermName( term.name, termName )
				)
		);

		if ( newTermNames.length === 0 ) {
			const ids = getCurrentTermIds( uniqueTerms, availableTerms );
			onUpdateTerms( ids );
			return;
		}

		if ( ! hasCreateAction ) {
			return;
		}

		let hasNewItems = false;
		newTermNames.forEach( ( termName ) => {
			const isCached = localTermCache.current[ unescapeString(termName).toLowerCase() ];
			if ( ! termsInQueue.current.has( termName ) && ! isCached ) {
				requestQueue.current.push( termName );
				termsInQueue.current.add( termName );
				hasNewItems = true;
			}
		} );

		if ( hasNewItems ) {
			processQueue( availableTerms );
		} else {
			const ids = getCurrentTermIds( uniqueTerms, availableTerms );
			onUpdateTerms( ids );
		}
	}

	function appendTerm( newTerm ) {
		if ( termIds.includes( newTerm.id ) ) {
			return;
		}

		const newTermIds = [ ...termIds, newTerm.id ];
		const defaultName = slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' );
		const termAddedMessage = sprintf(
			/* translators: %s: term name. */
			_x( '%s added', 'term' ),
			taxonomy?.labels?.singular_name ?? defaultName
		);

		speak( termAddedMessage, 'assertive' );
		onUpdateTerms( newTermIds );
	}

	const newTermLabel =
		taxonomy?.labels?.add_new_item ??
		( slug === 'post_tag' ? __( 'Add Tag' ) : __( 'Add Term' ) );
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
		<VStack spacing={ 4 }>
			<FormTokenField
				__next40pxDefaultSize
				value={ values }
				suggestions={ suggestions }
				onChange={ onChange }
				onInputChange={ debouncedSearch }
				maxSuggestions={ MAX_TERMS_SUGGESTIONS }
				label={ newTermLabel }
				messages={ {
					added: termAddedLabel,
					removed: termRemovedLabel,
					remove: removeTermLabel,
				} }
			/>
			<MostUsedTerms taxonomy={ taxonomy } onSelect={ appendTerm } />
		</VStack>
	);
}

export default withFilters( 'editor.PostTaxonomyType' )( FlatTermSelector );
