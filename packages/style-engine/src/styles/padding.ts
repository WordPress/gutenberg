/**
 * Internal dependencies
 */
import type { Style } from '../types';
import { generateBoxRules } from './utils';

const padding = {
	name: 'padding',
	generate: ( style: Style, selector: string ) => {
		return generateBoxRules(
			style,
			selector,
			[ 'spacing', 'padding' ],
			'padding'
		);
	},
};

export default padding;
