/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';

const textTransform = {
	name: 'textTransform',
	generate: ( style: Style, options: StyleOptions ) => {
		const styleValue: string | undefined = get(
			style,
			[ 'typography', 'textTransform' ],
			null
		);

		return styleValue
			? [
					{
						selector: options?.selector,
						key: 'textTransform',
						value: styleValue,
					},
			  ]
			: [];
	},
};

export default textTransform;
