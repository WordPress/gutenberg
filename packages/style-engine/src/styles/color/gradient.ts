/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule, getSlugFromPreset } from '../utils';

const text = {
	name: 'gradient',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'color', 'gradient' ],
			'gradient',
			options
		);
	},
	getClassNames: ( style: Style ) => {
		const classNames = [];
		const styleValue: string | undefined = get( style, [
			'color',
			'gradient',
		] );

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

export default text;
