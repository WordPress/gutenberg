/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, StyleOptions } from '../../types';

const backgroundImage = {
	name: 'backgroundImage',
	generate: ( style: Style, options: StyleOptions ) => {
		const _backgroundImage = style?.media?.backgroundImage;
		const _backgroundSize = style?.media?.backgroundSize;

		const styleRules: GeneratedCSSRule[] = [];

		if ( ! _backgroundImage ) {
			return styleRules;
		}

		if ( _backgroundImage?.source === 'file' && _backgroundImage?.url ) {
			styleRules.push( {
				selector: options.selector,
				key: 'backgroundImage',
				value: `url( '${ _backgroundImage.url }' )`,
			} );
		}

		// If no background size is set, but an image is, default to cover.
		if ( ! _backgroundSize ) {
			styleRules.push( {
				selector: options.selector,
				key: 'backgroundSize',
				value: 'cover',
			} );
		}

		return styleRules;
	},
};

export default [ backgroundImage ];
