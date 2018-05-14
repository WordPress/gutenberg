/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';

export const name = 'core/video';

export const definition = {
	title: __( 'Video' ),
	description: __( 'Embed an video file and a simple video player.' ),
	category: 'common',
	attributes: {
		id: {
			type: 'number',
		},
		src: {
			type: 'string',
		},
		caption: {
			type: 'array',
		},
	},
};

export const implementation = {
	icon: 'format-video',

	attributes: {
		src: {
			source: 'attribute',
			selector: 'video',
			attribute: 'src',
		},
		caption: {
			source: 'children',
			selector: 'figcaption',
		},
	},

	supports: {
		align: true,
	},

	edit,

	save( { attributes } ) {
		const { src, caption } = attributes;
		return (

			<figure>
				{ src && <video controls src={ src } /> }
				{ caption && caption.length > 0 && <RichText.Content tagName="figcaption" value={ caption } /> }
			</figure>
		);
	},
};
