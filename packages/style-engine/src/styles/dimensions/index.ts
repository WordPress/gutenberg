/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const minHeight = {
	name: 'minHeight',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'minHeight' ],
			'minHeight'
		);
	},
};

const aspectRatio = {
	name: 'aspectRatio',
	generate: ( style: Style, options: StyleOptions ) => {
		const _aspectRatio = style?.dimensions?.aspectRatio;

		const styleRules: GeneratedCSSRule[] = [];

		if ( ! _aspectRatio ) {
			return styleRules;
		}

		// To ensure the aspect ratio does not get overridden by `minHeight` unset any existing rule.
		styleRules.push( {
			selector: options.selector,
			key: 'minHeight',
			value: 'unset',
		} );

		styleRules.push(
			...generateRule(
				style,
				options,
				[ 'dimensions', 'aspectRatio' ],
				'aspectRatio'
			)
		);

		return styleRules;
	},
};

export default [ minHeight, aspectRatio ];
