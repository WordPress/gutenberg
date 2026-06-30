/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Flex,
	FlexItem,
	SearchControl,
	TextHighlight,
	Composite,
} from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useDebouncedInput } from '@wordpress/compose';
import { focus } from '@wordpress/dom';
import { safeDecodeURI } from '@wordpress/url';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { mapToIHasNameAndId } from './utils';

const EMPTY_ARRAY = [];

function SuggestionListItem( {
	suggestion,
	search,
	onSelect,
	entityForSuggestions,
} ) {
	const baseCssClass =
		'edit-site-custom-template-modal__suggestions_list__list-item';
	return (
		<Composite.Item
			render={
				<Button
					__next40pxDefaultSize
					role="option"
					className={ baseCssClass }
					onClick={ () =>
						onSelect(
							entityForSuggestions.config.getSpecificTemplate(
								suggestion
							)
						)
					}
				/>
			}
		>
			<Text variant="heading-md" className={ `${ baseCssClass }__title` }>
				<TextHighlight
					text={ decodeEntities( suggestion.name ) }
					highlight={ search }
				/>
			</Text>
			{ suggestion.link && (
				<Text variant="body-md" className={ `${ baseCssClass }__info` }>
					{ safeDecodeURI( suggestion.link ) }
				</Text>
			) }
		</Composite.Item>
	);
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
		if ( ! searchHasResolved ) {
			return;
		}
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
					orientation="vertical"
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
						/>
					) ) }
				</Composite>
			) }
			{ debouncedSearch && ! suggestions?.length && (
				<Text
					variant="body-md"
					render={ <p /> }
					className="edit-site-custom-template-modal__no-results"
				>
					{ labels.not_found }
				</Text>
			) }
		</>
	);
}

function AddCustomTemplateModalContent( {
	onSelect,
	entityForSuggestions,
	onBack,
	containerRef,
} ) {
	const [ showSearchEntities, setShowSearchEntities ] = useState(
		entityForSuggestions.hasGeneralTemplate
	);

	// Focus on the first focusable element when the modal opens.
	// We handle focus management in the parent modal, just need to focus on the first focusable element.
	useEffect( () => {
		if ( containerRef.current ) {
			const [ firstFocusable ] = focus.focusable.find(
				containerRef.current
			);
			firstFocusable?.focus();
		}
	}, [ showSearchEntities ] );

	return (
		<Stack
			direction="column"
			gap="lg"
			className="edit-site-custom-template-modal__contents-wrapper"
			align="flex-start"
		>
			{ ! showSearchEntities && (
				<>
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'Select whether to create a single template for all items or a specific one.'
						) }
					</Text>
					<Flex
						className="edit-site-custom-template-modal__contents"
						gap="4"
						align="initial"
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
							<Text variant="heading-md">
								{ entityForSuggestions.labels.all_items }
							</Text>
							<Text variant="body-md">
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
							<Text variant="heading-md">
								{ entityForSuggestions.labels.singular_name }
							</Text>
							<Text variant="body-md">
								{
									// translators: The user is given the choice to set up a template for all items of a post type or taxonomy, or just a specific one.
									__( 'For a specific item' )
								}
							</Text>
						</FlexItem>
					</Flex>
					<Flex justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onBack }
						>
							{ __( 'Back' ) }
						</Button>
					</Flex>
				</>
			) }
			{ showSearchEntities && (
				<>
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'This template will be used only for the specific item chosen.'
						) }
					</Text>
					<SuggestionList
						entityForSuggestions={ entityForSuggestions }
						onSelect={ onSelect }
					/>
					<Flex justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => {
								// If general template exists, go directly back to main screen
								// instead of showing the choice screen
								if ( entityForSuggestions.hasGeneralTemplate ) {
									onBack();
								} else {
									setShowSearchEntities( false );
								}
							} }
						>
							{ __( 'Back' ) }
						</Button>
					</Flex>
				</>
			) }
		</Stack>
	);
}

export default AddCustomTemplateModalContent;
