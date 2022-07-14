/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Flex,
	FlexItem,
	Modal,
	SearchControl,
	TextHighlight,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { mapToIHasNameAndId } from './utils';

const EMPTY_ARRAY = [];

function selectSuggestion( suggestion, onSelect, entityForSuggestions ) {
	const {
		labels,
		slug,
		config: { templateSlug, templatePrefix },
	} = entityForSuggestions;
	const title = sprintf(
		// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the singular name of a post type or taxonomy and %2$s is the name of the post or term, e.g. "Post: Hello, WordPress", "Category: shoes"
		__( '%1$s: %2$s' ),
		labels.singular_name,
		suggestion.name
	);
	let newTemplateSlug = `${ templateSlug || slug }-${ suggestion.slug }`;
	if ( templatePrefix ) {
		newTemplateSlug = templatePrefix + newTemplateSlug;
	}
	const newTemplate = {
		title,
		description: sprintf(
			// translators: Represents the description of a user's custom template in the Site Editor, e.g. "Template for Post: Hello, WordPress"
			__( 'Template for %1$s' ),
			title
		),
		slug: newTemplateSlug,
	};
	onSelect( newTemplate );
}

function SuggestionListItem( {
	suggestion,
	search,
	onSelect,
	entityForSuggestions,
	composite,
} ) {
	const baseCssClass =
		'edit-site-custom-template-modal__suggestions_list__list-item';
	return (
		<CompositeItem
			role="option"
			as={ Button }
			{ ...composite }
			className={ baseCssClass }
			onClick={ () =>
				selectSuggestion( suggestion, onSelect, entityForSuggestions )
			}
		>
			<span className={ `${ baseCssClass }__title` }>
				<TextHighlight text={ suggestion.name } highlight={ search } />
			</span>
			{ suggestion.link && (
				<span className={ `${ baseCssClass }__info` }>
					{ suggestion.link }
				</span>
			) }
		</CompositeItem>
	);
}

function useDebouncedInput() {
	const [ input, setInput ] = useState( '' );
	const [ debounced, setter ] = useState( '' );
	const setDebounced = useDebounce( setter, 250 );
	useEffect( () => {
		if ( debounced !== input ) {
			setDebounced( input );
		}
	}, [ debounced, input ] );
	return [ input, setInput, debounced ];
}

function useSearchSuggestions( entityForSuggestions, search ) {
	const { config, postsToExclude } = entityForSuggestions;
	const query = useMemo(
		() => ( {
			order: 'asc',
			_fields: 'id,name,title,slug,link',
			context: 'view',
			search,
			orderBy: config.getOrderBy( { search } ),
			exclude: postsToExclude,
			per_page: search ? 20 : 10,
		} ),
		[ search, config, postsToExclude ]
	);
	const { records: searchResults, hasResolved: searchHasResolved } =
		useEntityRecords(
			entityForSuggestions.type,
			entityForSuggestions.slug,
			query
		);
	const [ suggestions, setSuggestions ] = useState( EMPTY_ARRAY );
	useEffect( () => {
		if ( ! searchHasResolved ) return;
		let newSuggestions = EMPTY_ARRAY;
		if ( searchResults?.length ) {
			newSuggestions = searchResults;
			if ( config.recordNamePath ) {
				newSuggestions = mapToIHasNameAndId(
					newSuggestions,
					config.recordNamePath
				);
			}
		}
		// Update suggestions only when the query has resolved, so as to keep
		// the previous results in the UI.
		setSuggestions( newSuggestions );
	}, [ searchResults, searchHasResolved ] );
	return suggestions;
}

function SuggestionList( { entityForSuggestions, onSelect } ) {
	const composite = useCompositeState( { orientation: 'vertical' } );
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const suggestions = useSearchSuggestions(
		entityForSuggestions,
		debouncedSearch
	);
	const { labels } = entityForSuggestions;
	const [ showSearchControl, setShowSearchControl ] = useState( false );
	if ( ! showSearchControl && suggestions?.length > 9 ) {
		setShowSearchControl( true );
	}
	return (
		<>
			{ showSearchControl && (
				<SearchControl
					onChange={ setSearch }
					value={ search }
					label={ labels.search_items }
					placeholder={ labels.search_items }
				/>
			) }
			{ !! suggestions?.length && (
				<Composite
					{ ...composite }
					role="listbox"
					className="edit-site-custom-template-modal__suggestions_list"
					aria-label={ __( 'Suggestions list' ) }
				>
					{ suggestions.map( ( suggestion ) => (
						<SuggestionListItem
							key={ suggestion.slug }
							suggestion={ suggestion }
							search={ debouncedSearch }
							onSelect={ onSelect }
							entityForSuggestions={ entityForSuggestions }
							composite={ composite }
						/>
					) ) }
				</Composite>
			) }
			{ debouncedSearch && ! suggestions?.length && (
				<p className="edit-site-custom-template-modal__no-results">
					{ labels.not_found }
				</p>
			) }
		</>
	);
}

function AddCustomTemplateModal( { onClose, onSelect, entityForSuggestions } ) {
	const [ showSearchEntities, setShowSearchEntities ] = useState(
		entityForSuggestions.hasGeneralTemplate
	);
	const baseCssClass = 'edit-site-custom-template-modal';
	return (
		<Modal
			title={ sprintf(
				// translators: %s: Name of the post type e.g: "Post".
				__( 'Add template: %s' ),
				entityForSuggestions.labels.singular_name
			) }
			className={ baseCssClass }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
		>
			{ ! showSearchEntities && (
				<>
					<p>
						{ __(
							'Select whether to create a single template for all items or a specific one.'
						) }
					</p>
					<Flex
						className={ `${ baseCssClass }__contents` }
						gap="4"
						align="initial"
					>
						<FlexItem
							isBlock
							onClick={ () => {
								const { slug, title, description } =
									entityForSuggestions.template;
								onSelect( { slug, title, description } );
							} }
						>
							<Heading level={ 5 }>
								{ entityForSuggestions.labels.all_items }
							</Heading>
							<Text as="span">
								{
									// translators: The user is given the choice to set up a template for all items of a post type or taxonomy, or just a specific one.
									__( 'For all items' )
								}
							</Text>
						</FlexItem>
						<FlexItem
							isBlock
							onClick={ () => {
								setShowSearchEntities( true );
							} }
						>
							<Heading level={ 5 }>
								{ entityForSuggestions.labels.singular_name }
							</Heading>
							<Text as="span">
								{
									// translators: The user is given the choice to set up a template for all items of a post type or taxonomy, or just a specific one.
									__( 'For a specific item' )
								}
							</Text>
						</FlexItem>
					</Flex>
				</>
			) }
			{ showSearchEntities && (
				<>
					<p>
						{ __(
							'This template will be used only for the specific item chosen.'
						) }
					</p>
					<SuggestionList
						entityForSuggestions={ entityForSuggestions }
						onSelect={ onSelect }
					/>
				</>
			) }
		</Modal>
	);
}

export default AddCustomTemplateModal;
