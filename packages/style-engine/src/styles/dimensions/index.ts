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

		// For aspect ratio to work, the width must be 100%.
		// If a width support is added in the future, this should be updated
		// to check if a width value is present before outputting this rule.
		styleRules.push( {
			selector: options.selector,
			key: 'width',
			value: '100%',
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
