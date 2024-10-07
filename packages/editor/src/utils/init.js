/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	bootstrapBlockBindingsSourcesFromServer,
	registerCoreBlockBindingsSources,
} from '../bindings/api';

export function init( settings ) {
	// Reapply block type filters to ensure that any new block types are handler properly.
	dispatch( blocksStore ).reapplyBlockTypeFilters();

	// Register all Block Bindings sources.
	bootstrapBlockBindingsSourcesFromServer( settings?.blockBindingsSources );
	registerCoreBlockBindingsSources();

	// Run all the actions that should happen during editor's initialization.
	doAction( 'editor.init', settings );
}
