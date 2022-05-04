/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule, getSlugFromPreset } from '../utils';

const text = {
	name: 'text',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule( style, [ 'color', 'text' ], 'color', options );
	},
	getClassNames: ( style: Style ) => {
		const classNames = [];
		const styleValue: string | undefined = style?.color?.text;
		if ( styleValue ) {
			const slug = getSlugFromPreset( styleValue, 'color' );
			if ( slug ) {
				classNames.push( `has-${ slug }-color` );
			}
			// Primary color classes must come before the `has-text-color`,
			// `has-background` and `has-link-color` classes to maintain backwards
			// compatibility and avoid block invalidations.
			classNames.push( 'has-text-color' );
		}

		return classNames;
	},
};

export default text;
