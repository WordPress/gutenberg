/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const lineHeight = {
	name: 'lineHeight',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'typography', 'lineHeight' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'line-height',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default lineHeight;
