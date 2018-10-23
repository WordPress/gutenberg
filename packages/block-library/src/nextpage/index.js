/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

export const name = 'core/nextpage';

export const settings = {
	title: __( 'Page break' ),

	description: __( 'This block allows you to set break points on your post. Visitors of your blog are then presented with content split into multiple pages.' ),

	icon: <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M9 12h6v-2H9zm-7 0h5v-2H2zm15 0h5v-2h-5zm3 2v2l-6 6H6a2 2 0 0 1-2-2v-6h2v6h6v-4a2 2 0 0 1 2-2h6zM4 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4h-2V4H6v4z" /></g></svg>,

	category: 'layout',

	keywords: [ __( 'next page' ), __( 'pagination' ) ],

	supports: {
		customClassName: false,
		className: false,
		html: false,
	},

	attributes: {},

	transforms: {
		from: [
			{
				type: 'raw',
				schema: {
					'wp-block': { attributes: [ 'data-block' ] },
				},
				isMatch: ( node ) => node.dataset && node.dataset.block === 'core/nextpage',
				transform() {
					return createBlock( 'core/nextpage', {} );
				},
			},
		],
	},

	edit() {
		return (
			<div className="wp-block-nextpage">
				<span>{ __( 'Page break' ) }</span>
			</div>
		);
	},

	save() {
		return (
			<RawHTML>
				{ '<!--nextpage-->' }
			</RawHTML>
		);
	},
};
