/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const fontWeight = {
	name: 'fontWeight',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'typography', 'fontWeight' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'fontWeight',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default fontWeight;
