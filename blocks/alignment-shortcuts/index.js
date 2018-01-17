/**
 * External dependencies
 */
import { map, first } from 'lodash';

/**
 * Holds an array of alignment shortcut transforms.
 *
 * @return {Array} Array of transforms.
 */
export default map( {
	left: 'l',
	center: 'c',
	right: 'r',
}, ( shortcut, value ) => ( {
	type: 'shortcut',
	shortcut,
	transform( attributes ) {
		const firstAlign = first( attributes ).align;
		const isSame = attributes.every( ( { align } ) => align === firstAlign );

		// If already aligned, set back to default.
		if ( isSame && firstAlign === value ) {
			return { align: undefined };
		}

		return { align: value };
	},
} ) );
