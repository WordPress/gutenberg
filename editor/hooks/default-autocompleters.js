/**
 * External dependencies
 */
import { clone, once } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getDefaultBlockName } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { blockAutocompleter, userAutocompleter } from '../components';

const defaultAutocompleters = [ userAutocompleter ];

const fetchReusableBlocks = once( () => dispatch( 'core/editor' ).fetchReusableBlocks() );

function setDefaultCompleters( completers, blockName ) {
	if ( ! completers ) {
		// Provide copies so filters may directly modify them.
		completers = defaultAutocompleters.map( clone );
		// Add blocks autocompleter for Paragraph block
		if ( blockName === getDefaultBlockName() ) {
			completers.push( clone( blockAutocompleter ) );

			/*
			 * NOTE: This is a hack to help ensure reusable blocks are loaded
			 * so they may be included in the block completer. It can be removed
			 * once we have a way for completers to Promise options while
			 * store-based data dependencies are being resolved.
			 */
			fetchReusableBlocks();
		}
	}
	return completers;
}

addFilter(
	'editor.Autocomplete.completers',
	'editor/autocompleters/set-default-completers',
	setDefaultCompleters
);
