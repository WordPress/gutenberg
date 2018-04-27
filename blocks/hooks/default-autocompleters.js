/**
 * External dependencies
 */
import { clone } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { userAutocompleter } from '../autocompleters';

const defaultAutocompleters = [ userAutocompleter ];

function setDefaultCompleters( completers ) {
	if ( ! completers ) {
		// Provide copies so filters may directly modify them.
		completers = defaultAutocompleters.map( clone );
	}
	return completers;
}

addFilter(
	'blocks.Autocomplete.completers',
	'blocks/autocompleters/set-default-completers',
	setDefaultCompleters
);
