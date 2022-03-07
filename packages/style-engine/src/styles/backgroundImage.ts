/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, StyleOptions } from '../types';

const padding = {
	name: 'backgroundImage',
	generate: ( style: Style, options: StyleOptions ) => {
		const backgroundImage = style?.backgroundImage;

		const styleRules: GeneratedCSSRule[] = [];

		if ( ! backgroundImage ) {
			return styleRules;
		}

		if ( backgroundImage?.source === 'file' && backgroundImage?.url ) {
			styleRules.push( {
				selector: options.selector,
				key: 'backgroundImage',
				value: `url( '${ backgroundImage.url }' )`,
			} );
		}

		return styleRules;
	},
};

export default padding;
