/**
 * WordPress dependencies
 */
import getBlockData from '@wordpress/blocks/macro';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import save from './save';
import transforms from './transforms';

const { name, ...metadata } = getBlockData( './block.json' );

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			content: __( 'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.' ),
			customFontSize: 28,
			dropCap: true,
		},
	},
	supports: {
		className: false,
	},
	transforms,
	deprecated,
	merge( attributes, attributesToMerge ) {
		return {
			content: ( attributes.content || '' ) + ( attributesToMerge.content || '' ),
		};
	},
	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( [ 'wide', 'full', 'left', 'right' ].indexOf( width ) !== -1 ) {
			return { 'data-align': width };
		}
	},
	edit,
	save,
};
