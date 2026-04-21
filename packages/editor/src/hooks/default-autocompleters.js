/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { linkAutocompleter, userAutocompleter } from '../components';

function setDefaultCompleters( completers = [] ) {
	// Provide copies so filters may directly modify them.
	completers.push( { ...linkAutocompleter }, { ...userAutocompleter } );

	return completers;
}

addFilter(
	'editor.Autocomplete.completers',
	'editor/autocompleters/set-default-completers',
	setDefaultCompleters
);
