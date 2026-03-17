/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const background = {
	name: 'background',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'color', 'background' ],
			'backgroundColor'
		);
	},
};

export default background;
