/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { justifyStretch, paragraph } from '@wordpress/icons';

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
		name: 'stretchy-text',
		title: __( 'Stretchy Text' ),
		description: __( 'Text that resizes to fit its container.' ),
		icon: justifyStretch,
		attributes: {
			fitText: true,
		},
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText === true,
	},
];

export default variations;
