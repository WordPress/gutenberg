import { __, _x, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { withFilters } from '@wordpress/components';
import { Field, SearchableChipSelect, Stack } from '@wordpress/ui';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '../../store';
import { unescapeString } from '../../utils/terms';
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
 *  - Can't use "unbound" query. The search needs a fixed number.
 */
const MAX_TERMS_SUGGESTIONS = 100;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	_fields: 'id,name',
	context: 'view',
};

/**
 * Maps a term record to the `{ value, label }` shape the select works with.
 *
 * @param {Object} term The term record.
 *
 * @return {{value: string, label: string}} The select item.
 */
const termToItem = ( term ) => ( {
	value: String( term.id ),
	label: unescapeString( term.name ),
} );
const itemToTermId = ( item ) => Number( item.value );
const isSameTerm = ( termA, termB ) => termA.value === termB.value;
const isSameTermName = ( nameA, nameB ) =>
	nameA.toLowerCase() === nameB.toLowerCase();

/**
 * Value of the item that creates a term out of the typed name. Terms are
 * otherwise keyed by their id.
 */
const CREATE_TERM_VALUE = '__create__';

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
	const [ inputValue, setInputValue ] = useState( '' );
	const [ suggestions, setSuggestions ] = useState( EMPTY_ARRAY );
	const lastSearchRef = useRef( '' );
	const registry = useRegistry();

	const { editPost } = useDispatch( editorStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );
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
				// Sort ids so reordering alone doesn't produce a new query key and re-fetch.
				include: _termIds?.length
					? [ ..._termIds ].sort( ( a, b ) => a - b ).join( ',' )
					: undefined,
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

	// Update terms state only after the selectors are resolved.
	// We're using this to avoid terms temporarily disappearing on slow networks
	// while core data makes REST API requests.
	useEffect( () => {
		if ( hasResolvedTerms ) {
			setValues( ( terms ?? [] ).map( termToItem ) );
		}
	}, [ terms, hasResolvedTerms ] );

	const searchTerms = useCallback(
		async ( search ) => {
			lastSearchRef.current = search;

			const records = await registry
				.resolveSelect( coreStore )
				.getEntityRecords( 'taxonomy', slug, {
					...DEFAULT_QUERY,
					search,
				} );

			// Ignore requests that resolved out of order.
			if ( lastSearchRef.current === search ) {
				setSuggestions( ( records ?? [] ).map( termToItem ) );
			}
		},
		[ registry, slug ]
	);
	const debouncedSearch = useDebounce( searchTerms, 500 );

	// The typed term can be created when it doesn't match a suggestion or an
	// already selected term.
	const newTermName = inputValue.trim();
	const hasExactMatch = [ ...suggestions, ...values ].some( ( term ) =>
		isSameTermName( term.label, newTermName )
	);
	const creatableItem = useMemo(
		() =>
			hasCreateAction && !! newTermName && ! hasExactMatch
				? {
						value: CREATE_TERM_VALUE,
						label: sprintf(
							/* translators: %s: term name. */
							_x( 'Create: %s', 'term' ),
							newTermName
						),
						creatable: true,
				  }
				: undefined,
		[ hasCreateAction, hasExactMatch, newTermName ]
	);
	const items = useMemo(
		() =>
			creatableItem ? [ ...suggestions, creatableItem ] : suggestions,
		[ suggestions, creatableItem ]
	);

	if ( ! hasAssignAction ) {
		return null;
	}

	async function findOrCreateTerm( name ) {
		try {
			const newTerm = await saveEntityRecord(
				'taxonomy',
				slug,
				{ name },
				{ throwOnError: true }
			);
			return termToItem( newTerm );
		} catch ( error ) {
			if ( error.code !== 'term_exists' ) {
				throw error;
			}

			return { value: String( error.data.term_id ), label: name };
		}
	}

	function onUpdateTerms( newTermIds ) {
		editPost( { [ taxonomy.rest_base ]: newTermIds } );
	}

	function onChange( newValues ) {
		const hasCreatableItem = newValues.some(
			( item ) => item.value === CREATE_TERM_VALUE
		);
		const selectedTerms = newValues.filter(
			( item ) => item.value !== CREATE_TERM_VALUE
		);
		const selectedTermIds = selectedTerms.map( itemToTermId );

		// Optimistically update term values.
		// The selector will always re-fetch terms later.
		setValues( selectedTerms );

		if ( newValues.length !== values.length ) {
			speak(
				newValues.length > values.length
					? termAddedLabel
					: termRemovedLabel,
				'assertive'
			);
		}

		if ( ! hasCreatableItem ) {
			onUpdateTerms( selectedTermIds );
			return;
		}

		findOrCreateTerm( newTermName )
			.then( ( savedTerm ) => {
				setValues( [ ...selectedTerms, savedTerm ] );
				onUpdateTerms( [
					...selectedTermIds,
					itemToTermId( savedTerm ),
				] );
			} )
			.catch( ( error ) => {
				createErrorNotice( error.message, {
					type: 'snackbar',
				} );
				// In case of a failure, only assign the existing terms.
				onUpdateTerms( selectedTermIds );
			} );
	}

	function appendTerm( newTerm ) {
		if ( termIds.includes( newTerm.id ) ) {
			return;
		}

		const newTermIds = [ ...termIds, newTerm.id ];
		speak( termAddedLabel, 'assertive' );
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
	const notFoundLabel =
		taxonomy?.labels?.not_found ?? __( 'No results found.' );

	function onInputValueChange( nextInputValue ) {
		setInputValue( nextInputValue );

		// Nothing to search for when the input is cleared, either by the user or
		// after a selection.
		if ( nextInputValue ) {
			debouncedSearch( nextInputValue );
		}
	}

	return (
		<Stack direction="column" gap="lg">
			<Field.Root>
				<Field.Label>{ newTermLabel }</Field.Label>
				<SearchableChipSelect
					autoHighlight
					openOnInputClick={ false }
					// Terms are searched through the REST API.
					filter={ null }
					items={ items }
					value={ values }
					onValueChange={ onChange }
					isItemEqualToValue={ isSameTerm }
					inputValue={ inputValue }
					onInputValueChange={ onInputValueChange }
					emptyContent={ notFoundLabel }
					searchPlaceholder=""
					showClearButton={ false }
					chipsContent={ ( selectedTerms ) =>
						selectedTerms.map( ( term ) => (
							<SearchableChipSelect.ChipWithRemove
								key={ term.value }
								removeLabel={ sprintf(
									/* translators: %s: term name. */
									_x( 'Remove %s', 'term' ),
									term.label
								) }
							>
								{ term.label }
							</SearchableChipSelect.ChipWithRemove>
						) )
					}
				/>
			</Field.Root>
			<MostUsedTerms taxonomy={ taxonomy } onSelect={ appendTerm } />
		</Stack>
	);
}

export default withFilters( 'editor.PostTaxonomyType' )( FlatTermSelector );
