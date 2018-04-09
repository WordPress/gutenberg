/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	registerBlockType
} from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';

registerBlockType( 'core/nextpage', {
	title: __( 'Page break' ),

	description: __( 'This block allows you to set break points on your post. Visitors of your blog are then presented with content split into multiple pages.' ),

	icon: 'admin-page',

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
} );