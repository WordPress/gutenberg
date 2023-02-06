/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateBoxRules } from '../utils';

const padding = {
	name: 'padding',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateBoxRules( style, options, [ 'spacing', 'padding' ], {
			default: 'padding',
			individual: 'padding%s',
		} );
	},
};

export default padding;
