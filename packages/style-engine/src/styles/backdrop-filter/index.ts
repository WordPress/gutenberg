/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const backdropFilter = {
	name: 'backdropFilter',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'backdropFilter' ],
			'backdropFilter'
		);
	},
};

export default [ backdropFilter ];
