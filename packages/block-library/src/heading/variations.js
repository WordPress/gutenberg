/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import {
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
} from '@wordpress/icons';

const LEVEL_ICONS = [
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
];

const variations = [
	...[ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
		name: `h${ level }`,
		title: sprintf(
			/* translators: %d: heading level e.g: "1", "2", "3" */
			__( 'Heading %d' ),
			level
		),
		description: __(
			'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.'
		),
		icon: LEVEL_ICONS[ level - 1 ],
		attributes: { level },
		scope: [ 'block', 'transform' ],
		keywords: [ `h${ level }` ],
		isActive: ( blockAttributes ) =>
			! blockAttributes.fitText && blockAttributes.level === level,
	} ) ),
	// There is a hardcoded workaround in packages/block-editor/src/store/selectors.js
	// to make Stretchy variations appear as the last of their sections in the inserter.
	{
		name: 'stretchy-heading',
		title: __( 'Stretchy Heading' ),
		description: __( 'Heading that resizes to fit its container.' ),
		icon: (
			<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<Path d="m3 18.6 6-4.7 6 4.7V5H3v13.6Zm16.2-9.8v1.5h2.2L17.7 14l1.1 1.1 3.7-3.7v2.2H24V8.8h-4.8Z" />
			</SVG>
		),
		attributes: { fitText: true },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText === true,
	},
];

export default variations;
