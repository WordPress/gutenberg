/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';

registerBlockType( 'promo/gutenberg-footer', {
	title: __( 'Editor Promo' ),

	icon: 'megaphone',

	category: 'common',

	save() {
		return (
			<div>
				<hr className="wp-block-separator" />
				<p style={ { color: '#9e9da4', fontSize: '14px', textAlign: 'center' } }>
					This post brought to you by the new
					{ ' ' }<a href="https://wordpress.org/plugins/gutenberg/">Gutenberg editor</a> for
					{ ' ' }<a href="https://wordpress.org">WordPress</a>!
				</p>
			</div>
		);
	},
} );
