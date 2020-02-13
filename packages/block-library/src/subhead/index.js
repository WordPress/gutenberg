/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Subheading (deprecated)' ),
	description: __(
		'This block is deprecated. Please use the Paragraph block instead.'
	),
	icon: (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path d="M7.1 6l-.5 3h4.5L9.4 19h3l1.8-10h4.5l.5-3H7.1z" />
		</SVG>
	),
	supports: {
		// Hide from inserter as this block is deprecated.
		inserter: false,
		multiple: false,
	},
	transforms,
	edit,
	save,
};
