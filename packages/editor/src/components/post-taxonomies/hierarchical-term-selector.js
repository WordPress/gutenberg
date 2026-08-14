import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { memo, useMemo, useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import {
	Button,
	CheckboxControl,
	TextControl,
	TreeSelect,
	withFilters,
	Flex,
	FlexItem,
	SearchControl,
	Spinner,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useDebounce, useEvent } from '@wordpress/compose';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { speak } from '@wordpress/a11y';
import { decodeEntities } from '@wordpress/html-entities';
import { buildTermsTree } from '../../utils/terms';
import { normalizeTextString } from '../../utils/normalize-text-string';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { RECEIVE_INTERMEDIATE_RESULTS } = unlock( coreDataPrivateApis );

/**
 * Module Constants
 */
const DEFAULT_QUERY = {
	per_page: -1,
	orderby: 'name',
	order: 'asc',
	_fields: 'id,name,parent',
	context: 'view',
	[ RECEIVE_INTERMEDIATE_RESULTS ]: true,
};
const MIN_TERMS_COUNT_FOR_FILTER = 8;
const EMPTY_ARRAY = [];

// Memoized on primitive props, so toggling one term does not re-render every
// checkbox in the list.
const TermCheckbox = memo( function Checkbox( {
	id,
	name,
	checked,
	onToggle,
} ) {
	return (
		<CheckboxControl
			checked={ checked }
			onChange={ () => onToggle( id ) }
			label={ decodeEntities( name ) }
		/>
	);
} );

function TermRow( { term, selectedTerms, onToggle } ) {
	return (
		<div className="editor-post-taxonomies__hierarchical-terms-choice">
			<TermCheckbox
				id={ term.id }
				name={ term.name }
				checked={ selectedTerms.has( term.id ) }
				onToggle={ onToggle }
			/>
			{ !! term.children.length && (
				<div className="editor-post-taxonomies__hierarchical-terms-subchoices">
					{ term.children.map( ( child ) => (
						<TermRow
							key={ child.id }
							term={ child }
							selectedTerms={ selectedTerms }
							onToggle={ onToggle }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}

/**
 * Sort Terms by Selected.
 *
 * @param {Object[]} termsTree Array of terms in tree format.
 * @param {number[]} terms     Selected terms.
 *
 * @return {Object[]} Sorted array of terms.
 */
export function sortBySelected( termsTree, terms ) {
	const selectedTerms = new Set( terms );
	const treeHasSelection = ( termTree ) => {
		if ( selectedTerms.has( termTree.id ) ) {
			return true;
		}
		return !! termTree.children?.some( treeHasSelection );
	};

	// Partition rather than sort: each subtree is walked once, and terms keep
	// their relative order within each group.
	const selected = [];
	const unselected = [];
	for ( const termTree of termsTree ) {
		if ( treeHasSelection( termTree ) ) {
			selected.push( termTree );
		} else {
			unselected.push( termTree );
		}
	}

	return [ ...selected, ...unselected ];
}

/**
 * Find term by parent id or name.
 *
 * @param {Object[]}      terms  Array of Terms.
 * @param {number|string} parent id.
 * @param {string}        name   Term name.
 * @return {Object} Term object.
 */
export function findTerm( terms, parent, name ) {
	return terms.find( ( term ) => {
		return (
			( ( ! term.parent && ! parent ) ||
				parseInt( term.parent ) === parseInt( parent ) ) &&
			term.name.toLowerCase() === name.toLowerCase()
		);
	} );
}

/**
 * Get filter matcher function.
 *
 * @param {string} filterValue Filter value.
 * @return {(function(Object): (Object|boolean))} Matcher function.
 */
export function getFilterMatcher( filterValue ) {
	// Normalize once rather than per visited term.
	const normalizedFilterValue = normalizeTextString( filterValue );
	const matchTermsForFilter = ( originalTerm ) => {
		if ( '' === filterValue ) {
			return originalTerm;
		}

		// Shallow clone, because we'll be filtering the term's children and
		// don't want to modify the original term.
		const term = { ...originalTerm };

		// Map and filter the children, recursive so we deal with grandchildren
		// and any deeper levels.
		if ( term.children.length > 0 ) {
			term.children = term.children
				.map( matchTermsForFilter )
				.filter( ( child ) => child );
		}

		// If the term's name contains the filterValue, or it has children
		// (i.e. some child matched at some point in the tree) then return it.
		if (
			-1 !==
				normalizeTextString( term.name ).indexOf(
					normalizedFilterValue
				) ||
			term.children.length > 0
		) {
			return term;
		}

		// Otherwise, return false. After mapping, the list of terms will need
		// to have false values filtered out.
		return false;
	};
	return matchTermsForFilter;
}

/**
 * Hierarchical term selector.
 *
 * @param {Object} props      Component props.
 * @param {string} props.slug Taxonomy slug.
 * @return {Element}        Hierarchical term selector component.
 */
export function HierarchicalTermSelector( { slug } ) {
	const [ adding, setAdding ] = useState( false );
	const [ formName, setFormName ] = useState( '' );
	/**
	 * @type {[number|'', Function]}
	 */
	const [ formParent, setFormParent ] = useState( '' );
	const [ showForm, setShowForm ] = useState( false );
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ filteredTermsTree, setFilteredTermsTree ] = useState( [] );
	const debouncedSpeak = useDebounce( speak, 500 );

	const {
		hasCreateAction,
		hasAssignAction,
		terms,
		loading,
		availableTerms,
		taxonomy,
	} = useSelect(
		( select ) => {
			const { getCurrentPost, getEditedPostAttribute } =
				select( editorStore );
			const { getEntityRecord, getEntityRecords, isResolving } =
				select( coreStore );
			const _taxonomy = getEntityRecord( 'root', 'taxonomy', slug );
			const post = getCurrentPost();

			return {
				hasCreateAction: _taxonomy
					? !! post._links?.[
							'wp:action-create-' + _taxonomy.rest_base
					  ]
					: false,
				hasAssignAction: _taxonomy
					? !! post._links?.[
							'wp:action-assign-' + _taxonomy.rest_base
					  ]
					: false,
				terms: _taxonomy
					? getEditedPostAttribute( _taxonomy.rest_base )
					: EMPTY_ARRAY,
				loading: isResolving( 'getEntityRecords', [
					'taxonomy',
					slug,
					DEFAULT_QUERY,
				] ),
				availableTerms:
					getEntityRecords( 'taxonomy', slug, DEFAULT_QUERY ) ||
					EMPTY_ARRAY,
				taxonomy: _taxonomy,
			};
		},
		[ slug ]
	);

	const { editPost } = useDispatch( editorStore );
	const { saveEntityRecord } = useDispatch( coreStore );

	const selectedTerms = useMemo( () => new Set( terms ), [ terms ] );
	const availableTermsTree = useMemo(
		() => sortBySelected( buildTermsTree( availableTerms ), terms ),
		// Remove `terms` from the dependency list to avoid reordering every time
		// checking or unchecking a term.
		[ availableTerms ]
	);

	/**
	 * Update terms for post.
	 *
	 * @param {number[]} termIds Term ids.
	 */
	const onUpdateTerms = ( termIds ) => {
		editPost( { [ taxonomy.rest_base ]: termIds } );
	};

	// Stable, so unchanged checkboxes can bail out of re-rendering.
	const onToggleTerm = useEvent( ( termId ) => {
		const id = parseInt( termId, 10 );
		onUpdateTerms(
			selectedTerms.has( id )
				? terms.filter( ( term ) => term !== id )
				: [ ...terms, id ]
		);
	} );

	const shownTerms =
		'' !== filterValue ? filteredTermsTree : availableTermsTree;

	const { createErrorNotice } = useDispatch( noticesStore );

	if ( ! hasAssignAction ) {
		return null;
	}

	/**
	 * Append new term.
	 *
	 * @param {Object} term Term object.
	 * @return {Promise} A promise that resolves to save term object.
	 */
	const addTerm = ( term ) => {
		return saveEntityRecord( 'taxonomy', slug, term, {
			throwOnError: true,
		} );
	};

	const onChangeFormName = ( value ) => {
		setFormName( value );
	};

	/**
	 * Handler for changing form parent.
	 *
	 * @param {number|''} parentId Parent post id.
	 */
	const onChangeFormParent = ( parentId ) => {
		setFormParent( parentId );
	};

	const onToggleForm = () => {
		setShowForm( ! showForm );
	};

	const onAddTerm = async ( event ) => {
		event.preventDefault();
		if ( formName === '' || adding ) {
			return;
		}

		// Check if the term we are adding already exists.
		const existingTerm = findTerm( availableTerms, formParent, formName );
		if ( existingTerm ) {
			// If the term we are adding exists but is not selected select it.
			if ( ! terms.some( ( term ) => term === existingTerm.id ) ) {
				onUpdateTerms( [ ...terms, existingTerm.id ] );
			}

			setFormName( '' );
			setFormParent( '' );

			return;
		}
		setAdding( true );
		let newTerm;
		try {
			newTerm = await addTerm( {
				name: formName,
				parent: formParent ? formParent : undefined,
			} );
		} catch ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
			} );
			return;
		}
		const defaultName =
			slug === 'category' ? __( 'Category' ) : __( 'Term' );
		const termAddedMessage = sprintf(
			/* translators: %s: term name. */
			_x( '%s added', 'term' ),
			taxonomy?.labels?.singular_name ?? defaultName
		);
		speak( termAddedMessage, 'assertive' );
		setAdding( false );
		setFormName( '' );
		setFormParent( '' );
		onUpdateTerms( [ ...terms, newTerm.id ] );
	};

	const setFilter = ( value ) => {
		const newFilteredTermsTree = availableTermsTree
			.map( getFilterMatcher( value ) )
			.filter( ( term ) => term );
		const getResultCount = ( termsTree ) => {
			let count = 0;
			for ( let i = 0; i < termsTree.length; i++ ) {
				count++;
				if ( undefined !== termsTree[ i ].children ) {
					count += getResultCount( termsTree[ i ].children );
				}
			}
			return count;
		};

		setFilterValue( value );
		setFilteredTermsTree( newFilteredTermsTree );

		const resultCount = getResultCount( newFilteredTermsTree );
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', resultCount ),
			resultCount
		);

		debouncedSpeak( resultsFoundMessage, 'assertive' );
	};

	const labelWithFallback = (
		labelProperty,
		fallbackIsCategory,
		fallbackIsNotCategory
	) =>
		taxonomy?.labels?.[ labelProperty ] ??
		( slug === 'category' ? fallbackIsCategory : fallbackIsNotCategory );

	const newTermButtonLabel = labelWithFallback(
		'add_new_item',
		__( 'Add Category' ),
		__( 'Add Term' )
	);
	const newTermLabel = labelWithFallback(
		'new_item_name',
		__( 'Add Category' ),
		__( 'Add Term' )
	);
	const parentSelectLabel = labelWithFallback(
		'parent_item',
		__( 'Parent Category' ),
		__( 'Parent Term' )
	);
	const noParentOption = `— ${ parentSelectLabel } —`;
	const newTermSubmitLabel = newTermButtonLabel;
	const filterLabel = taxonomy?.labels?.search_items ?? __( 'Search Terms' );
	const groupLabel = taxonomy?.name ?? __( 'Terms' );
	const showFilter = availableTerms.length >= MIN_TERMS_COUNT_FOR_FILTER;

	return (
		<Flex direction="column" gap="4">
			{ showFilter && ! loading && (
				<SearchControl
					label={ filterLabel }
					placeholder={ filterLabel }
					value={ filterValue }
					onChange={ setFilter }
				/>
			) }
			{ loading && (
				<Flex
					justify="center"
					style={ {
						// Match SearchControl height to prevent layout shift.
						height: '40px',
					} }
				>
					<Spinner />
				</Flex>
			) }
			<div
				className="editor-post-taxonomies__hierarchical-terms-list"
				tabIndex="0"
				role="group"
				aria-label={ groupLabel }
			>
				{ shownTerms.map( ( term ) => (
					<TermRow
						key={ term.id }
						term={ term }
						selectedTerms={ selectedTerms }
						onToggle={ onToggleTerm }
					/>
				) ) }
			</div>
			{ ! loading && hasCreateAction && (
				<FlexItem>
					<Button
						__next40pxDefaultSize
						onClick={ onToggleForm }
						className="editor-post-taxonomies__hierarchical-terms-add"
						aria-expanded={ showForm }
						variant="link"
					>
						{ newTermButtonLabel }
					</Button>
				</FlexItem>
			) }
			{ showForm && (
				<form onSubmit={ onAddTerm }>
					<Flex direction="column" gap="4">
						<TextControl
							className="editor-post-taxonomies__hierarchical-terms-input"
							label={ newTermLabel }
							value={ formName }
							onChange={ onChangeFormName }
							required
						/>
						{ !! availableTerms.length && (
							<TreeSelect
								label={ parentSelectLabel }
								noOptionLabel={ noParentOption }
								onChange={ onChangeFormParent }
								selectedId={ formParent }
								tree={ availableTermsTree }
							/>
						) }
						<FlexItem>
							<Button
								__next40pxDefaultSize
								variant="secondary"
								type="submit"
								className="editor-post-taxonomies__hierarchical-terms-submit"
							>
								{ newTermSubmitLabel }
							</Button>
						</FlexItem>
					</Flex>
				</form>
			) }
		</Flex>
	);
}

export default withFilters( 'editor.PostTaxonomyType' )(
	HierarchicalTermSelector
);
