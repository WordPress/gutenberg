/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const letterSpacing = {
	name: 'letterSpacing',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'typography', 'letterSpacing' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'letterSpacing',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default letterSpacing;
