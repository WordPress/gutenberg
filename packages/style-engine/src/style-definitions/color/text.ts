/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const text = {
	name: 'text',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule( style, options, [ 'color', 'text' ], 'color' );
	},
};

export default text;
