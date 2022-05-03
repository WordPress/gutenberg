/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const text = {
	name: 'text',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule( style, [ 'color', 'text' ], 'color', options );
	},
};

export default [ text ];
