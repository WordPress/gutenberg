/**
 * WordPress dependencies
 */
import { customLink as linkIcon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import { enhanceNavigationLinkVariations } from './hooks';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: linkIcon,
	__experimentalLabel: ( { label } ) => label,
	merge( leftAttributes, { label: rightLabel = '' } ) {
		return {
			...leftAttributes,
			label: leftAttributes.label + rightLabel,
		};
	},
	edit,
	save() {},
};

// importing this file includes side effects. This is whitelisted in block-library/package.json under sideEffects
addFilter(
	'blocks.registerBlockType',
	'edit-navigation/menu-item',
	enhanceNavigationLinkVariations
);
