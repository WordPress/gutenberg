/**
 * WordPress dependencies
 */
import { list as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import settingsV2 from './v2';

const { name } = metadata;

export { metadata, name };

const settingsV1 = {
	icon,
	example: {
		attributes: {
			values:
				'<li>Alice.</li><li>The White Rabbit.</li><li>The Cheshire Cat.</li><li>The Mad Hatter.</li><li>The Queen of Hearts.</li>',
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
	deprecated,
};

export const settings = window?.__experimentalEnableListBlockV2
	? settingsV2
	: settingsV1;
