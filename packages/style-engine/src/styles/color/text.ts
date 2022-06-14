/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const ALLOWED_STATES = [ 'hover' ];

const text = {
	name: 'text',
	generate: ( style: Style, options: StyleOptions ) => {
		const rtn = [
			generateRule( style, options, [ 'color', 'text' ], 'color' ),
			// Also generate rules for any associated "states"
			// if these exist in the supplied `style` rules under a
			// "states" key.
			...ALLOWED_STATES.map( ( state ) =>
				generateRule(
					style,
					{
						...options,
						selector: `${ options?.selector ?? '' }:${ state }`,
					},
					[ 'states', state, 'color', 'text' ],
					'color'
				)
			),
		];

		return rtn;
	},
};

export default text;
