/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden, MenuGroup } from '@wordpress/components';

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import LinkControlSearchCreate from './search-create-button';
import LinkControlSearchItem from './search-item';
import { CREATE_TYPE, LINK_ENTRY_TYPES } from './constants';

export default function LinkControlSearchResults( {
	instanceId,
	withCreateSuggestion,
	currentInputValue,
	handleSuggestionClick,
	suggestionsListProps,
	buildSuggestionItemProps,
	suggestions,
	selectedSuggestion,
	isLoading,
	isInitialSuggestions,
	createSuggestionButtonText,
	suggestionsQuery,
} ) {
	const resultsListClasses = clsx(
		'block-editor-link-control__search-results',
		{
			'is-loading': isLoading,
		}
	);

	const isSingleDirectEntryResult =
		suggestions.length === 1 &&
		LINK_ENTRY_TYPES.includes( suggestions[ 0 ].type );
	const shouldShowCreateSuggestion =
		withCreateSuggestion &&
		! isSingleDirectEntryResult &&
		! isInitialSuggestions;
	// If the query has a specified type, then we can skip showing them in the result. See #24839.
	const shouldShowSuggestionsTypes = ! suggestionsQuery?.type;

	// According to guidelines aria-label should be added if the label
	// itself is not visible.
	// See: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listbox_role
	const searchResultsLabelId = `block-editor-link-control-search-results-label-${ instanceId }`;
	const labelText = isInitialSuggestions
		? __( 'Suggestions' )
		: sprintf(
				/* translators: %s: search term. */
				__( 'Search results for "%s"' ),
				currentInputValue
		  );
	const searchResultsLabel = (
		<VisuallyHidden id={ searchResultsLabelId }>
			{ labelText }
		</VisuallyHidden>
	);

	return (
		<div className="block-editor-link-control__search-results-wrapper">
			{ searchResultsLabel }
			<div
				{ ...suggestionsListProps }
				className={ resultsListClasses }
				aria-labelledby={ searchResultsLabelId }
			>
				<MenuGroup>
					{ suggestions.map( ( suggestion, index ) => {
						if (
							shouldShowCreateSuggestion &&
							CREATE_TYPE === suggestion.type
						) {
							return (
								<LinkControlSearchCreate
									searchTerm={ currentInputValue }
									buttonText={ createSuggestionButtonText }
									onClick={ () =>
										handleSuggestionClick( suggestion )
									}
									// Intentionally only using `type` here as
									// the constant is enough to uniquely
									// identify the single "CREATE" suggestion.
									key={ suggestion.type }
									itemProps={ buildSuggestionItemProps(
										suggestion,
										index
									) }
									isSelected={ index === selectedSuggestion }
								/>
							);
						}

						// If we're not handling "Create" suggestions above then
						// we don't want them in the main results so exit early.
						if ( CREATE_TYPE === suggestion.type ) {
							return null;
						}

						return (
							<LinkControlSearchItem
								key={ `${ suggestion.id }-${ suggestion.type }` }
								itemProps={ buildSuggestionItemProps(
									suggestion,
									index
								) }
								suggestion={ suggestion }
								index={ index }
								onClick={ () => {
									handleSuggestionClick( suggestion );
								} }
								isSelected={ index === selectedSuggestion }
								isURL={ LINK_ENTRY_TYPES.includes(
									suggestion.type
								) }
								searchTerm={ currentInputValue }
								shouldShowType={ shouldShowSuggestionsTypes }
								isFrontPage={ suggestion?.isFrontPage }
								isBlogHome={ suggestion?.isBlogHome }
							/>
						);
					} ) }
				</MenuGroup>
			</div>
		</div>
	);
}
