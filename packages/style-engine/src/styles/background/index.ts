/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, StyleOptions } from '../../types';
import { safeDecodeURI } from '../utils';

const backgroundImage = {
	name: 'backgroundImage',
	generate: ( style: Style, options: StyleOptions ) => {
		const _backgroundImage = style?.background?.backgroundImage;
		const _backgroundSize = style?.background?.backgroundSize;

		const styleRules: GeneratedCSSRule[] = [];

		if ( ! _backgroundImage ) {
			return styleRules;
		}

		if ( _backgroundImage?.source === 'file' && _backgroundImage?.url ) {
			styleRules.push( {
				selector: options.selector,
				key: 'backgroundImage',
				// Passed `url` may already be encoded. To prevent double encoding, decodeURI is executed to revert to the original string.
				value: `url( '${ encodeURI(
					safeDecodeURI( _backgroundImage.url )
				) }' )`,
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
