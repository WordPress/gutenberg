/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render } from '@wordpress/element';
import { __experimentalFetchLinkSuggestions } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

export function initialize( id, settings ) {
	registerCoreBlocks();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( settings );
	}
	settings.__experimentalFetchLinkSuggestions = __experimentalFetchLinkSuggestions;
	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}
