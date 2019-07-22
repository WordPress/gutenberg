/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

const ALL_ALIGNMENTS = [ 'left', 'center', 'right', 'wide', 'full' ];

export { metadata, name };

export const settings = {
	title: __( 'Image' ),
	description: __( 'Insert an image to make a visual statement.' ),
	icon,
	keywords: [
		'img', // "img" is not translated as it is intended to reflect the HTML <img> tag.
		__( 'photo' ),
	],
	transforms,
	getEditWrapperProps( attributes ) {
		const { align, width, fullScreen } = attributes;

		if ( includes( ALL_ALIGNMENTS, align ) ) {
			return {
				'data-align': align,
				'data-resized': !! width,
				'data-full-screen': fullScreen ? 'true' : 'false',
			};
		}
	},
	edit,
	save,
	deprecated,
};
