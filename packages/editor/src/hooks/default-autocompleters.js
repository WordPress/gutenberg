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

function setDefaultCompleters( completers = [], blockName ) {
	// Provide copies so filters may directly modify them.
	completers.push( clone( userAutocompleter ) );

	// Add blocks autocompleter for Paragraph block
	if ( blockName === getDefaultBlockName() ) {
		completers.push( clone( blockAutocompleter ) );
	}

	return completers;
}

addFilter(
	'editor.Autocomplete.completers',
	'editor/autocompleters/set-default-completers',
	setDefaultCompleters
);
