/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const title = __( 'Query' );

/* From https://material.io/tools/icons */
export const icon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
	>
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
	</SVG>
);

export const settings = {
	title,
	icon,
	category: 'layout',
	keywords: [],
	description: __( 'A collection of posts.' ),
	attributes: {
		className: {
			type: 'string',
		},
		criteria: {
			type: 'object',
			default: {
				per_page: 3,
				offset: 0,
				tags: [],
				categories: [],
				author: [],
				specificPosts: [],
			},
		},
		blocks: {
			type: 'array',
			default: [
				{
					isValid: true,
					clientId: null,
					name: 'post-title',
					attributes: {},
					innerBlocks: [],
				},
			],
		},
	},
	supports: {
		html: false,
		align: false,
	},
	edit,
};
