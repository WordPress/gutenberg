import { __, _x, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { withFilters } from '@wordpress/components';
import { SearchableChipSelectControl, Stack } from '@wordpress/ui';
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

const CREATE_TERM_VALUE = '__create__';
const PENDING_TERM_PREFIX = '__pending__:';

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
const isPendingTerm = ( item ) => item.value.startsWith( PENDING_TERM_PREFIX );

/**
 * Renders a flat term selector component.
 *
 * @param {Object} props      The component props.
 * @param {string} props.slug The slug of the taxonomy.
 *
 * @return {React.ReactNode} The rendered flat term selector component.
 */
export function FlatTermSelector( { slug } ) {
	const [ values, setValues ] = useState( EMPTY_ARRAY );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ suggestions, setSuggestions ] = useState( EMPTY_ARRAY );
	const [ isSearching, setIsSearching ] = useState( false );
	const lastSearchRef = useRef( '' );
	// Terms being created, so that a request that resolves can tell whether its
	// term is still shown by the time it does.
	const pendingTermsRef = useRef( new Set() );
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
			setValues( ( currentValues ) => [
				...( terms ?? [] ).map( termToItem ),
				// Terms that are still being created aren't in the store yet.
				...currentValues.filter( isPendingTerm ),
			] );
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
				setIsSearching( false );
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

	// Assigns a term on top of the terms assigned at that moment, rather than
	// the ones a request closed over: a term created in parallel, or picked
	// from the most used ones, may have been assigned in the meantime.
	function assignTerm( termId ) {
		const assignedTermIds = registry
			.select( editorStore )
			.getEditedPostAttribute( taxonomy.rest_base );

		if ( ! assignedTermIds?.includes( termId ) ) {
			onUpdateTerms( [ ...( assignedTermIds ?? EMPTY_ARRAY ), termId ] );
		}
	}

	async function createTerm( name ) {
		const pendingTerm = {
			value: PENDING_TERM_PREFIX + name,
			label: name,
		};
		// Show the term right away, it is assigned once it exists.
		pendingTermsRef.current.add( pendingTerm.value );
		setValues( ( currentValues ) => [ ...currentValues, pendingTerm ] );

		let savedTerm;
		try {
			savedTerm = await findOrCreateTerm( name );
		} catch ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
			} );
			// Nothing was assigned, so only the shown term has to go.
			pendingTermsRef.current.delete( pendingTerm.value );
			setValues( ( currentValues ) =>
				currentValues.filter(
					( item ) => ! isSameTerm( item, pendingTerm )
				)
			);
			speak( termRemovedLabel, 'assertive' );
			return;
		}

		// The term was removed while it was being created.
		if ( ! pendingTermsRef.current.has( pendingTerm.value ) ) {
			return;
		}

		pendingTermsRef.current.delete( pendingTerm.value );
		setValues( ( currentValues ) =>
			currentValues
				// An existing term can come back for a name that only differs
				// by case or accent, and it may already be shown.
				.filter(
					( item ) =>
						isSameTerm( item, pendingTerm ) ||
						! isSameTerm( item, savedTerm )
				)
				.map( ( item ) =>
					isSameTerm( item, pendingTerm ) ? savedTerm : item
				)
		);
		assignTerm( itemToTermId( savedTerm ) );
		speak( termAddedLabel, 'assertive' );
	}

	async function onChange( newValues ) {
		const isCreatingTerm = newValues.some(
			( item ) => item.value === CREATE_TERM_VALUE
		);
		if ( isCreatingTerm ) {
			// Picking the create item leaves the assigned terms untouched, and
			// the term is only announced once it exists.
			await createTerm( newTermName );
			return;
		}

		if ( newValues.length !== values.length ) {
			speak(
				newValues.length > values.length
					? termAddedLabel
					: termRemovedLabel,
				'assertive'
			);
		}

		pendingTermsRef.current = new Set(
			newValues.filter( isPendingTerm ).map( ( item ) => item.value )
		);

		// Optimistically update term values.
		// The selector will always re-fetch terms later.
		setValues( newValues );
		onUpdateTerms(
			// Terms that are still being created have no id to assign yet.
			newValues
				.filter( ( item ) => ! isPendingTerm( item ) )
				.map( itemToTermId )
		);
	}

	function appendTerm( newTerm ) {
		if ( termIds.includes( newTerm.id ) ) {
			return;
		}

		speak( termAddedLabel, 'assertive' );
		assignTerm( newTerm.id );
	}

	const newTermLabel =
		taxonomy?.labels?.add_new_item ??
		( slug === 'post_tag' ? __( 'Add Tag' ) : __( 'Add Term' ) );
	const singularName =
		taxonomy?.labels?.singular_name ??
		( slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' ) );
	const termAddedLabel = sprintf(
		/* translators: %s: taxonomy singular name, e.g. "Tag". */
		_x( '%s added', 'term' ),
		singularName
	);
	const termRemovedLabel = sprintf(
		/* translators: %s: taxonomy singular name, e.g. "Tag". */
		_x( '%s removed', 'term' ),
		singularName
	);
	const notFoundLabel =
		taxonomy?.labels?.not_found ?? __( 'No results found.' );

	function onInputValueChange( nextInputValue ) {
		setInputValue( nextInputValue );
		// The suggestions are searched through the REST API and nothing filters
		// them on the client, so the ones for the previous input have to go
		// before they can be picked by mistake.
		setSuggestions( EMPTY_ARRAY );

		// Nothing to search for when the input is cleared, either by the user or
		// after a selection.
		if ( ! nextInputValue ) {
			debouncedSearch.cancel();
			setIsSearching( false );
			return;
		}

		setIsSearching( true );
		debouncedSearch( nextInputValue );
	}

	return (
		<Stack direction="column" gap="lg">
			<SearchableChipSelectControl
				autoHighlight
				openOnInputClick={ false }
				// Terms are searched through the REST API.
				filter={ null }
				label={ newTermLabel }
				items={ items }
				value={ values }
				onValueChange={ onChange }
				isItemEqualToValue={ isSameTerm }
				inputValue={ inputValue }
				onInputValueChange={ onInputValueChange }
				emptyContent={
					isSearching ? __( 'Searching…' ) : notFoundLabel
				}
				searchPlaceholder=""
				showClearButton={ false }
				chipsContent={ ( selectedTerms ) =>
					selectedTerms.map( ( term ) => (
						<SearchableChipSelectControl.ChipWithRemove
							key={ term.value }
							removeLabel={ sprintf(
								/* translators: %s: term name. */
								_x( 'Remove %s', 'term' ),
								term.label
							) }
						>
							{ term.label }
						</SearchableChipSelectControl.ChipWithRemove>
					) )
				}
			/>
			<MostUsedTerms taxonomy={ taxonomy } onSelect={ appendTerm } />
		</Stack>
	);
}

export default withFilters( 'editor.PostTaxonomyType' )( FlatTermSelector );
