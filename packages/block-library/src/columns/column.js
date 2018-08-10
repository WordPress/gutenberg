/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/editor';

export const name = 'core/column';

export const settings = {
	title: __( 'Column' ),

	parent: [ 'core/columns' ],

	icon: 'columns',

	description: __( 'A single column within a columns block.' ),

	category: 'common',

	edit() {
		return <InnerBlocks templateLock={ false } />;
	},

	save() {
		return <div><InnerBlocks.Content /></div>;
	},
};
