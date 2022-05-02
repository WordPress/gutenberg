/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const text = {
	name: 'text',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'color', 'text' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'color',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default text;
