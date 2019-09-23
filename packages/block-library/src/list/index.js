/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'List' ),
	description: __( 'Create a bulleted or numbered list.' ),
	icon,
	keywords: [ __( 'bullet list' ), __( 'ordered list' ), __( 'numbered list' ) ],
	supports: {
		className: false,
	},
	example: {
		attributes: {
			values: '<li>Alice.</li><li>The White Rabbit.</li><li>The Mouse.</li><li>The Dodo.</li><li>The Lory.</li><li>The Eaglet.</li><li>The Duck.</li><li>The Cheshire Cat.</li><li>The Mad Hatter.</li>',
		},
	},
	transforms,
	merge( attributes, attributesToMerge ) {
		const { values } = attributesToMerge;

		if ( ! values || values === '<li></li>' ) {
			return attributes;
		}

		return {
			...attributes,
			values: attributes.values + values,
		};
	},
	edit,
	save,
};
