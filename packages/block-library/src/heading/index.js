/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { heading as icon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

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
	title: __( 'Heading' ),
	description: __(
		'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.'
	),
	icon,
	keywords: [ __( 'title' ), __( 'subtitle' ) ],
	example: {
		attributes: {
			content: __( 'Code is Poetry' ),
			level: 2,
		},
	},
	__experimentalLabel( attributes, { context } ) {
		if ( context === 'accessibility' ) {
			const { content, level } = attributes;

			return isEmpty( content )
				? sprintf(
						/* translators: accessibility text. %s: heading level. */
						__( 'Level %s. Empty.' ),
						level
				  )
				: sprintf(
						/* translators: accessibility text. 1: heading level. 2: heading content. */
						__( 'Level %1$s. %2$s' ),
						level,
						content
				  );
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
			name: 'h1',
			title: 'h1',
			attributes: {
				level: 1,
				placeholder: 'I am level 1',
			},
			// scope: [],
			// supports: {
			// 	__experimentalSelector: 'h1',
			// },
		},
		{
			name: 'h2',
			title: 'h2',
			// isDefault: true,
			attributes: {
				level: 2,
				placeholder: 'I am level 2',
			},
			// scope: [],
			// supports: {
			// 	__experimentalSelector: 'h2',
			// },
		},
		{
			name: 'h3',
			title: 'h3',
			isDefault: true,
			attributes: {
				level: 3,
				placeholder: 'I am level 3',
			},
			// scope: [],
			// supports: {
			// 	__experimentalSelector: 'h3',
			// },
		},
		{
			name: 'h4',
			title: 'h4',
			attributes: {
				level: 4,
				placeholder: 'I am level 4',
			},
			// scope: [],
			// supports: {
			// 	__experimentalSelector: 'h4',
			// },
		},
		{
			name: 'h5',
			title: 'h5',
			attributes: {
				level: 5,
				placeholder: 'I am level 5',
			},
			// scope: [],
			// supports: {
			// 	__experimentalSelector: 'h5',
			// },
		},
		{
			name: 'h6',
			title: 'h6',
			attributes: {
				level: 6,
				placeholder: 'I am level 6',
			},
			// scope: [],
			// supports: {
			// 	__experimentalSelector: 'h6',
			// },
		},
	],
};
