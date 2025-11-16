/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import { paragraph } from '@wordpress/icons';

const variations = [
	{
		name: 'paragraph',
		title: __( 'Paragraph' ),
		description: __(
			'Start with the basic building block of all narrative.'
		),
		isDefault: true,
		scope: [ 'block', 'inserter', 'transform' ],
		attributes: { fitText: undefined },
		icon: paragraph,
	},
	// There is a hardcoded workaround in packages/block-editor/src/store/selectors.js
	// to make Stretchy variations appear as the last of their sections in the inserter.
	{
		name: 'stretchy-paragraph',
		title: __( 'Stretchy Paragraph' ),
		description: __( 'Paragraph that resizes to fit its container.' ),
		icon: (
			<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<Path d="M3 9c0 2.8 2.2 5 5 5v-.2V20h1.5V5.5H12V20h1.5V5.5h3V4H8C5.2 4 3 6.2 3 9Zm16.2-.2v1.5h2.2L17.7 14l1.1 1.1 3.7-3.7v2.2H24V8.8h-4.8Z" />
			</SVG>
		),
		attributes: {
			fitText: true,
		},
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText === true,
	},
];

export default variations;
