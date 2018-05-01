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
import { blockAutocompleter, userAutocompleter } from '../autocompleters';
import { getDefaultBlockName } from '../api/registration';

const defaultAutocompleters = [ userAutocompleter ];

function setDefaultCompleters( completers, blockName ) {
	if ( ! completers ) {
		// Provide copies so filters may directly modify them.
		completers = defaultAutocompleters.map( clone );
		// Add blocks autocompleter for Paragraph block
		if ( blockName === getDefaultBlockName() ) {
			completers.push( clone( blockAutocompleter ) );
		}
	}
	return completers;
}

addFilter(
	'blocks.Autocomplete.completers',
	'blocks/autocompleters/set-default-completers',
	setDefaultCompleters
);
