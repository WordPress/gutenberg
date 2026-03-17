/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const shadow = {
	name: 'shadow',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule( style, options, [ 'shadow' ], 'boxShadow' );
	},
};

export default [ shadow ];
