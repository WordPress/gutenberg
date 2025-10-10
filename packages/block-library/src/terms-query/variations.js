/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/components';

export const titleDate = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Path d="M41 9H7v3h34V9zm-22 5H7v1h12v-1zM7 26h12v1H7v-1zm34-5H7v3h34v-3zM7 38h12v1H7v-1zm34-5H7v3h34v-3z" />
	</SVG>
);

export const titleExcerpt = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Path d="M41 9H7v3h34V9zm-4 5H7v1h30v-1zm4 3H7v1h34v-1zM7 20h30v1H7v-1zm0 12h30v1H7v-1zm34 3H7v1h34v-1zM7 38h30v1H7v-1zm34-11H7v3h34v-3z" />
	</SVG>
);

const termName = [
	'core/paragraph',
	{
		metadata: {
			name: __( 'Term Name' ),
			bindings: {
				content: {
					source: 'core/term-data',
					args: {
						key: 'name',
					},
				},
			},
		},
	},
];
const termCount = [
	'core/paragraph',
	{
		placeholder: __( '(count)' ),
		metadata: {
			name: __( 'Term Count' ),
			bindings: {
				content: {
					source: 'core/term-data',
					args: {
						key: 'count',
					},
				},
			},
		},
	},
];

const variations = [
	{
		name: 'title',
		title: __( 'Title' ),
		description: __( "Display the terms' titles." ),
		attributes: {},
		icon: titleDate,
		scope: [ 'block' ],
		innerBlocks: [ [ 'core/term-template', {}, [ termName ] ] ],
	},
	{
		name: 'title-count',
		title: __( 'Title & Count' ),
		description: __(
			"Display the terms' titles and number of posts assigned to each term."
		),
		attributes: {},
		icon: titleExcerpt,
		scope: [ 'block' ],
		innerBlocks: [
			[
				'core/term-template',
				{},
				[
					[
						'core/group',
						{ layout: { type: 'flex', flexWrap: 'nowrap' } },
						[ termName, termCount ],
					],
				],
			],
		],
	},
];

export default variations;
