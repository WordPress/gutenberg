/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule, getSlugFromPreset } from '../utils';

const background = {
	name: 'background',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'color', 'background' ],
			'backgroundColor',
			options
		);
	},
	getClassNames: ( style: Style ) => {
		const classNames = [];
		const styleValue: string | undefined = style?.color?.background;

		if ( styleValue ) {
			const slug = getSlugFromPreset( styleValue, 'color' );
			if ( slug ) {
				classNames.push( `has-${ slug }-background-color` );
			}
			// Primary color classes must come before the `has-text-color`,
			// `has-background` and `has-link-color` classes to maintain backwards
			// compatibility and avoid block invalidations.
			classNames.push( 'has-background' );
		}

		return classNames;
	},
};

export default background;
