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
const BASE_QUERY = {
	order: 'asc',
	_fields: 'id,title,slug,link',
	context: 'view',
};

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
			onClick={ () => {
				const title = sprintf(
					// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the singular name of a post type and %2$s is the name of the post, e.g. "Post: Hello, WordPress"
					__( '%1$s: %2$s' ),
					entityForSuggestions.labels.singular_name,
					suggestion.name
				);
				onSelect( {
					title,
					description: sprintf(
						// translators: Represents the description of a user's custom template in the Site Editor, e.g. "Template for Post: Hello, WordPress"
						__( 'Template for %1$s' ),
						title
					),
					slug: `single-${ entityForSuggestions.slug }-${ suggestion.slug }`,
				} );
			} }
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

function SuggestionList( { entityForSuggestions, onSelect } ) {
	const composite = useCompositeState( { orientation: 'vertical' } );
	const [ suggestions, setSuggestions ] = useState( EMPTY_ARRAY );
	// We need to track two values, the search input's value(searchInputValue)
	// and the one we want to debounce(search) and make REST API requests.
	const [ searchInputValue, setSearchInputValue ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 250 );
	const query = {
		...BASE_QUERY,
		search,
		orderby: search ? 'relevance' : 'modified',
		exclude: entityForSuggestions.postsToExclude,
		per_page: search ? 20 : 10,
	};
	const { records: searchResults, hasResolved: searchHasResolved } =
		useEntityRecords(
			entityForSuggestions.type,
			entityForSuggestions.slug,
			query
		);
	useEffect( () => {
		if ( search !== searchInputValue ) {
			debouncedSearch( searchInputValue );
		}
	}, [ search, searchInputValue ] );
	const entitiesInfo = useMemo( () => {
		if ( ! searchResults?.length ) return EMPTY_ARRAY;
		return mapToIHasNameAndId( searchResults, 'title.rendered' );
	}, [ searchResults ] );
	// Update suggestions only when the query has resolved.
	useEffect( () => {
		if ( ! searchHasResolved ) return;
		setSuggestions( entitiesInfo );
	}, [ entitiesInfo, searchHasResolved ] );
	return (
		<>
			<SearchControl
				onChange={ setSearchInputValue }
				value={ searchInputValue }
				label={ entityForSuggestions.labels.search_items }
				placeholder={ entityForSuggestions.labels.search_items }
			/>
			{ !! suggestions?.length && (
				<Composite
					{ ...composite }
					role="listbox"
					className="edit-site-custom-template-modal__suggestions_list"
				>
					{ suggestions.map( ( suggestion ) => (
						<SuggestionListItem
							key={ suggestion.slug }
							suggestion={ suggestion }
							search={ search }
							onSelect={ onSelect }
							entityForSuggestions={ entityForSuggestions }
							composite={ composite }
						/>
					) ) }
				</Composite>
			) }
			{ search && ! suggestions?.length && (
				<p className="edit-site-custom-template-modal__no-results">
					{ entityForSuggestions.labels.not_found }
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
									// translators: The user is given the choice to set up a template for all items of a post type, or just a specific one.
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
									// translators: The user is given the choice to set up a template for all items of a post type, or just a specific one.
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
