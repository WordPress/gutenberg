/**
 * External dependencies
 */
import { map, first } from 'lodash';

export const shortcuts = {
	left: 'l',
	center: 'c',
	right: 'r',
};

/**
 * Holds an array of alignment shortcut transforms.
 *
 * @return {Array} Array of transforms.
 */
export default map( shortcuts, ( shortcut, value ) => ( {
	type: 'shortcut',
	shortcut,
	transform( blocks ) {
		const firstAlign = first( blocks ).attributes.align;
		const isSame = blocks.every( ( { attributes: { align } } ) => align === firstAlign );

		// If already aligned, set back to default.
		if ( isSame && firstAlign === value ) {
			return { align: undefined };
		}

		return { align: value };
	},
} ) );
