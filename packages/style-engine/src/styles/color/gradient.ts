/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule, getSlugFromPreset } from '../utils';

const gradient = {
	name: 'gradient',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'color', 'gradient' ],
			'background',
			options
		);
	},
	getClassNames: ( style: Style ) => {
		const classNames = [];
		const styleValue: string | number | undefined = style?.color?.gradient;

		if ( styleValue ) {
			const slug = getSlugFromPreset( styleValue, 'gradient' );
			if ( slug ) {
				classNames.push( `has-${ slug }-gradient-background` );
			}
			// Primary color classes must come before the `has-text-color`,
			// `has-background` and `has-link-color` classes to maintain backwards
			// compatibility and avoid block invalidations.
			classNames.push( 'has-background' );
		}

		return classNames;
	},
};

export default gradient;
