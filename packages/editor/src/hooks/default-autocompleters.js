/**
 * External dependencies
 */
import { clone } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { blockAutocompleter, userAutocompleter } from '../components';

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
	'editor.Autocomplete.completers',
	'editor/autocompleters/set-default-completers',
	setDefaultCompleters
);
