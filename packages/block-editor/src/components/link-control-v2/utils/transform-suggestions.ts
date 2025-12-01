/**
 * Internal dependencies
 */
import type { LinkSuggestion, ComboboxControlOption } from '../types';

/**
 * Transforms a LinkSuggestion to a ComboboxControlOption.
 *
 * @param suggestion The link suggestion to transform.
 * @return The combobox control option.
 */
export function transformSuggestionToOption(
	suggestion: LinkSuggestion
): ComboboxControlOption {
	return {
		label: suggestion.title,
		value: suggestion.url,
		// Store the full suggestion data for later use
		suggestion,
	};
}

/**
 * Transforms an array of LinkSuggestion to ComboboxControlOption.
 *
 * @param suggestions Array of link suggestions.
 * @return Array of combobox control options.
 */
export function transformSuggestionsToOptions(
	suggestions: LinkSuggestion[]
): ComboboxControlOption[] {
	return suggestions.map( transformSuggestionToOption );
}
