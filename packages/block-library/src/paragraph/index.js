/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { paragraph as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			content: __(
				'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
			),
		},
	},
	__experimentalLabel( attributes, { context } ) {
		if ( context === 'accessibility' ) {
			const { content } = attributes;
			return ! content || content.length === 0 ? __( 'Empty' ) : content;
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
	variations: [
		{
			name: 'core/post-custom-field',
			title: __( 'Post Summary' ),
			description: __(
				'Just a block to edit a custom field named "summary".'
			),
			attributes: {
				source: { content: { type: 'meta', name: 'summary' } },
			},
			isActive: ( blockAttributes ) =>
				blockAttributes.source?.content?.type === 'meta' &&
				blockAttributes.source?.content?.name === 'summary',
			scope: [ 'block', 'inserter', 'transform' ],
		},
	],
};

export const init = () => initBlock( { name, metadata, settings } );
