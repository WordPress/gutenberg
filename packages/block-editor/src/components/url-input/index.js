/**
 * Internal dependencies
 */
import URLInputWithInlineSuggestions from './inline-suggestion-list/url-input-with-inline-suggestions';
import URLInputWithPopoverSuggestions from './popover-suggestion-list/url-input-with-popover-suggestions';

export default function URLInput( { __experimentalUseInlineSuggestions = false, ...props } ) {
	return __experimentalUseInlineSuggestions ?
		<URLInputWithInlineSuggestions { ...props } /> :
		<URLInputWithPopoverSuggestions { ...props } />;
}
