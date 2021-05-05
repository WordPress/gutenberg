/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { home } from '@wordpress/icons';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: home,

	description: createInterpolateElement(
		_x( 'Link to <a>your homepage</a>.', 'block description' ),
		//TODO: slot/fill to override link
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		{ a: <a href="options-reading.php" /> }
	),

	edit,

	save,

	example: {
		attributes: {
			label: _x( 'Home Link', 'block example' ),
		},
	},
};
