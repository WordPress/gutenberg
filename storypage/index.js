/**
 * WordPress dependencies
 */
import { dispatch, registerActions } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as blocks from './blocks';
import * as components from './components';

const category = {
	slug: 'storypage',
	title: 'StoryPage Blocks',
};

// Registering 'addCategories' and 'removeCategories'
// actions to 'core/blocks' store
registerActions( 'core/blocks', {

	// current actions
	...dispatch( 'core/blocks' ),

	// new actions
	addCategories: ( categories ) => ( {
		type: 'ADD_CATEGORIES',
		categories,
	} ),
	removeCategories: ( categories ) => ( {
		type: 'REMOVE_CATEGORIES',
		categories,
	} ),
} );

// Removing 'widgets' category
dispatch( 'core/blocks' ).removeCategories( [ 'widgets' ] );

// Adding 'StoryPage Blocks' category
dispatch( 'core/blocks' ).addCategories( [ category ] );

export {
	blocks,
	components,
};
