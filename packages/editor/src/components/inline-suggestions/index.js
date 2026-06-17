/**
 * Inline suggestions: the `core/suggestion` marker format and its decoration,
 * built on the shared inline-markers primitive. A suggested inline change lives
 * as marked text in block content (Option B) and is type-aware:
 *
 * - `del` (deletion): existing text proposed for removal. Front-end keeps the
 *   text and strips the wrapper until the suggestion is accepted.
 * - `add` (addition): proposed new text. Front-end strips the wrapper *and* the
 *   text until the suggestion is accepted.
 *
 * The render-time strip (keep del-text, drop add-text, remove all wrappers) is
 * handled server-side by `gutenberg_strip_inline_suggestion_markers`
 * (`lib/compat/wordpress-7.1/block-suggestions.php`).
 */

export {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_CLASS,
	SUGGESTION_ANNOTATION_SOURCE,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_ADDITION,
	suggestionFormat,
	registerSuggestionFormat,
	findSuggestionRange,
} from './format';
export { useAnnotateSuggestions } from './use-annotate-suggestions';
export { acceptInlineDeletion, rejectInlineDeletion } from './operations';
