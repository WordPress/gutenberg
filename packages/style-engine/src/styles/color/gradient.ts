/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const gradient = {
	name: 'gradient',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'color', 'gradient' ],
			'background'
		);
	},
};

export default gradient;
