/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { justifyStretch, heading } from '@wordpress/icons';

const variations = [
	{
		name: 'heading',
		title: __( 'Heading' ),
		description: __(
			'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.'
		),
		isDefault: true,
		scope: [ 'block', 'inserter', 'transform' ],
		attributes: { fitText: undefined },
		icon: heading,
	},
	// There is a hardcoded workaround in packages/block-editor/src/store/selectors.js
	// to make Stretchy variations appear as the last of their sections in the inserter.
	{
		name: 'stretchy-heading',
		title: __( 'Stretchy Heading' ),
		description: __( 'Heading that resizes to fit its container.' ),
		icon: justifyStretch,
		attributes: { fitText: true },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText === true,
	},
];

export default variations;
