/**
 * WordPress dependencies
 */
import { createAtom } from '@wordpress/data';

export const shortcutsByNameAtom = createAtom( {} );
export const shortcutNamesAtom = createAtom( [] );
export const shortcutsAtom = createAtom(
	( get ) => {
		const shortcutsByName = get( shortcutsByNameAtom );
		return get( shortcutNamesAtom ).map( ( id ) =>
			get( shortcutsByName[ id ] )
		);
	},
	() => {},
	'shortcuts'
);
