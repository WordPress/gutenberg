/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Column' ),
	parent: [ 'core/columns' ],
	icon,
	description: __( 'A single column within a columns block.' ),
	supports: {
		inserter: false,
		reusable: false,
		html: false,
	},
	getEditWrapperProps( attributes ) {
		const { width } = attributes;

		// A column should act as a "pass-through", meaning that it cannot be
		// selected by typical focus interactions. A block becomes selected by
		// virtue of its focus handler, and by nullifying its tabIndex, it will
		// no longer handle focus events.
		const props = { tabIndex: undefined };

		if ( Number.isFinite( width ) ) {
			props.style = {
				flexBasis: width + '%',
			};
		}

		return props;
	},
	edit,
	save,
};

