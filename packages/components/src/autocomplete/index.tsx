import deprecated from '@wordpress/deprecated';
import type { AutocompleteProps, UseAutocompleteProps } from './types';

/**
 * Returns no props. The hook is deprecated and kept only so that existing
 * calls keep rendering; autocompletion now lives in the block editor.
 */
export function useDeprecatedAutocompleteProps(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	options: UseAutocompleteProps
) {
	deprecated(
		'`__unstableUseAutocompleteProps` from `@wordpress/components`',
		{
			since: '7.2',
			hint: 'The hook no longer provides autocompletion. The block editor’s RichText component accepts completers through its autocompleters prop.',
		}
	);
	return {};
}

/**
 * Renders its children without autocompletion. The component is deprecated
 * and kept only so that existing calls keep rendering.
 */
export default function Autocomplete( { children }: AutocompleteProps ) {
	deprecated( 'wp.components.Autocomplete', {
		since: '7.2',
		hint: 'The component no longer provides autocompletion. The block editor’s RichText component accepts completers through its autocompleters prop.',
	} );
	return children( {
		listBoxId: undefined,
		activeId: null,
		onKeyDown: () => {},
	} );
}
