/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateBoxRules } from '../utils';

const margin = {
	name: 'margin',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateBoxRules( style, options, [ 'spacing', 'margin' ], {
			default: 'margin',
			individual: 'margin%s',
		} );
	},
};

export default margin;
