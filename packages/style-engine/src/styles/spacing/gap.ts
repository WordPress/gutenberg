/**
 * Internal dependencies
 */
import type { Style, StyleOptions, GeneratedCSSRule } from '../../types';
import { generateRule } from '../utils';

const gap = {
	name: 'gap',
	generate: ( style: Style, options: StyleOptions ): GeneratedCSSRule[] => {
		const gapValue = style?.spacing?.blockGap;

		if ( gapValue === undefined || gapValue === '0' ) {
			return [];
		}

		return generateRule( style, options, [ 'spacing', 'blockGap' ], 'gap' );
	},
};

export default gap;
