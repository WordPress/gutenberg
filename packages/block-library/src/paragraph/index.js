/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { paragraph as icon } from '@wordpress/icons';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Paragraph' ),
	description: __( 'Start with the building block of all narrative.' ),
	icon,
	keywords: [ __( 'text' ) ],
	example: {
		attributes: {
			content: __(
				'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
			),
			style: {
				typography: {
					fontSize: 28,
				},
			},
			dropCap: true,
		},
	},
	supports: {
		className: false,
		__unstablePasteTextInline: true,
		lightBlockWrapper: true,
		// TODO: Decide how to handle it.
		__experimentalColor: Platform.OS === 'web',
		__experimentalLineHeight: true,
		__experimentalFontSize: true,
	},
	__experimentalLabel( attributes, { context } ) {
		if ( context === 'accessibility' ) {
			const { content } = attributes;
			return isEmpty( content ) ? __( 'Empty' ) : content;
		}
	},
	transforms,
	deprecated,
	merge( attributes, attributesToMerge ) {
		return {
			content:
				( attributes.content || '' ) +
				( attributesToMerge.content || '' ),
		};
	},
	edit,
	save,
};
