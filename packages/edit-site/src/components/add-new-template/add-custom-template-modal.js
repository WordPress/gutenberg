/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	FlexItem,
	Modal,
	SearchControl,
	TextHighlight,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import TemplateActionsLoadingScreen from './template-actions-loading-screen';
import { mapToIHasNameAndId } from './utils';

const EMPTY_ARRAY = [];

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
				onSelect(
					entityForSuggestions.config.getSpecificTemplate(
						suggestion
					)
				)
			}
		>
			<Text
				size="body"
				lineHeight={ 1.53846153846 } // 20px
				weight={ 500 }
				className={ `${ baseCssClass }__title` }
			>
				<TextHighlight
					text={ decodeEntities( suggestion.name ) }
					highlight={ search }
				/>
			</Text>
			{ suggestion.link && (
				<Text
					size="body"
					lineHeight={ 1.53846153846 } // 20px
					className={ `${ baseCssClass }__info` }
				>
					{ suggestion.link }
				</Text>
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
	const { config } = entityForSuggestions;
	const query = useMemo(
		() => ( {
			order: 'asc',
			context: 'view',
			search,
			per_page: search ? 20 : 10,
			...config.queryArgs( search ),
		} ),
		[ search, config ]
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
					__nextHasNoMarginBottom
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
				<Text
					as="p"
					className="edit-site-custom-template-modal__no-results"
				>
					{ labels.not_found }
				</Text>
			) }
		</>
	);
}

function AddCustomTemplateModal( {
	onClose,
	onSelect,
	entityForSuggestions,
	isCreatingTemplate,
} ) {
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
			onRequestClose={ onClose }
		>
			{ isCreatingTemplate && <TemplateActionsLoadingScreen /> }
			{ ! showSearchEntities && (
				<VStack spacing={ 4 }>
					<Text as="p">
						{ __(
							'Select whether to create a single template for all items or a specific one.'
						) }
					</Text>
					<VStack
						className={ `${ baseCssClass }__contents` }
						spacing={ 0 }
					>
						<FlexItem
							isBlock
							as={ Button }
							onClick={ () => {
								const {
									slug,
									title,
									description,
									templatePrefix,
								} = entityForSuggestions.template;
								onSelect( {
									slug,
									title,
									description,
									templatePrefix,
								} );
							} }
						>
							<Text
								as="span"
								weight={ 500 }
								lineHeight={ 1.53846153846 } // 20px
							>
								{ entityForSuggestions.labels.all_items }
							</Text>
							<Text
								as="span"
								lineHeight={ 1.53846153846 } // 20px
							>
								{
									// translators: The user is given the choice to set up a template for all items of a post type or taxonomy, or just a specific one.
									__( 'For all items' )
								}
							</Text>
						</FlexItem>
						<FlexItem
							isBlock
							as={ Button }
							onClick={ () => {
								setShowSearchEntities( true );
							} }
						>
							<Text
								as="span"
								weight={ 500 }
								lineHeight={ 1.53846153846 } // 20px
							>
								{ entityForSuggestions.labels.singular_name }
							</Text>
							<Text
								as="span"
								lineHeight={ 1.53846153846 } // 20px
							>
								{
									// translators: The user is given the choice to set up a template for all items of a post type or taxonomy, or just a specific one.
									__( 'For a specific item' )
								}
							</Text>
						</FlexItem>
					</VStack>
				</VStack>
			) }
			{ showSearchEntities && (
				<VStack spacing={ 4 }>
					<Text as="p">
						{ __(
							'This template will be used only for the specific item chosen.'
						) }
					</Text>
					<SuggestionList
						entityForSuggestions={ entityForSuggestions }
						onSelect={ onSelect }
					/>
				</VStack>
			) }
		</Modal>
	);
}

export default AddCustomTemplateModal;
