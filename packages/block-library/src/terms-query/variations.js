/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/components';

export const titleDate = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Path d="M 41,9 H 7 v 3 h 34 z m 0,9 H 7 v 3 h 34 z m 0,18 H 7 v 3 h 34 z m 0,-9 H 7 v 3 h 34 z" />
	</SVG>
);

export const titleExcerpt = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Path d="m 36,36 h 5 v 3 h -5 z m 0,-9 h 5 v 3 h -5 z m 0,-9 h 5 v 3 h -5 z m 0,-9 h 5 v 3 H 36 Z M 31,9 H 7 v 3 h 24 z m 0,9 H 7 v 3 h 24 z m 0,18 H 7 v 3 h 24 z m 0,-9 H 7 v 3 h 24 z" />
	</SVG>
);

const termName = [
	'core/term-name',
	{
		isLink: true,
	},
];

const variations = [
	{
		name: 'name',
		title: __( 'Name' ),
		description: __( "Display the terms' names." ),
		attributes: {},
		icon: titleDate,
		scope: [ 'block' ],
		innerBlocks: [ [ 'core/term-template', {}, [ termName ] ] ],
	},
	{
		name: 'name-count',
		title: __( 'Name & Count' ),
		description: __(
			"Display the terms' names and number of posts assigned to each term."
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
						[ termName, [ 'core/term-count' ] ],
					],
				],
			],
		],
	},
];

export default variations;
