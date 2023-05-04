/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	symbol as reusableIcon,
	receipt as patternIcon,
} from '@wordpress/icons';

const isActive = ( blockAttributes, variationAttributes ) =>
	blockAttributes.type === variationAttributes.type;

const variations = [
	{
		name: 'reusable',
		title: __( 'Reusable block' ),
		description: __(
			'Create and save content to reuse across your site. Update the block, and the changes apply everywhere it’s used.'
		),
		attributes: { type: 'reusable' },
		isDefault: true,
		icon: reusableIcon,
		isActive,
	},
	{
		name: 'pattern',
		title: __( 'Pattern' ),
		description: __( 'Show a block pattern.' ),
		attributes: { type: 'pattern' },
		// @todo - add a pattern icon.
		icon: patternIcon,
		isActive,
	},
];

export default variations;
