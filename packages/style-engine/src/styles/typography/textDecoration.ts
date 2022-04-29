/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const textDecoration = {
	name: 'lineHeight',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'typography', 'textDecoration' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'textDecoration',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default textDecoration;
