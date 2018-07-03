/**
 * External dependencies
 */
import { reject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dispatch, select, registerActions } from '@wordpress/data';
import { SUGGESTED_PANEL, SHARED_PANEL } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as blocks from './blocks';
import * as components from './components';

const category = {
	slug: 'storypage',
	title: __( 'StoryPage Blocks' ),
};

// Registering new actions
// actions to 'core/blocks' store
registerActions( 'core/blocks', {
	// current actions
	...dispatch( 'core/blocks' ),

	// 'hideInserterMenuPanel' and 'hideInserterMenuPanel'
	// to handle with inserter menu panels
	hideInserterMenuPanel: ( slug ) => ( {
		type: 'HIDE_INSERTER_MENU_PANEL',
		slug,
	} ),
	showInserterMenuPanel: ( slug ) => ( {
		type: 'SHOW_INSERTER_MENU_PANEL',
		slug,
	} ),
} );

const categories = [
	category,
	...reject( select( 'core/blocks' ).getCategories(), { slug: 'widgets' } ),
];

dispatch( 'core/blocks' ).setCategories( categories );

// Hidding 'shared' and suggested panels
dispatch( 'core/blocks' ).hideInserterMenuPanel( SHARED_PANEL );
dispatch( 'core/blocks' ).hideInserterMenuPanel( SUGGESTED_PANEL );

export {
	blocks,
	components,
};
