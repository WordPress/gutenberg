/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const fontSize = {
	name: 'fontSize',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'typography', 'fontSize' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'font-size',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default fontSize;
