/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, StyleOptions } from '../../types';
import { generateRule, safeDecodeURI } from '../utils';

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
		if ( _backgroundSize === undefined ) {
			styleRules.push( {
				selector: options.selector,
				key: 'backgroundSize',
				value: 'cover',
			} );
		}

		return styleRules;
	},
};

const backgroundPosition = {
	name: 'backgroundRepeat',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'background', 'backgroundPosition' ],
			'backgroundPosition'
		);
	},
};

const backgroundRepeat = {
	name: 'backgroundRepeat',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'background', 'backgroundRepeat' ],
			'backgroundRepeat'
		);
	},
};

const backgroundSize = {
	name: 'backgroundSize',
	generate: ( style: Style, options: StyleOptions ) => {
		const _backgroundSize = style?.background?.backgroundSize;
		const _backgroundPosition = style?.background?.backgroundPosition;

		const styleRules: GeneratedCSSRule[] = [];

		if ( _backgroundSize === undefined ) {
			return styleRules;
		}

		styleRules.push(
			...generateRule(
				style,
				options,
				[ 'background', 'backgroundSize' ],
				'backgroundSize'
			)
		);

		// If background size is set to contain, but no position is set, default to center.
		if (
			_backgroundSize === 'contain' &&
			_backgroundPosition === undefined
		) {
			styleRules.push( {
				selector: options.selector,
				key: 'backgroundPosition',
				value: 'center',
			} );
		}

		return styleRules;
	},
};

export default [
	backgroundImage,
	backgroundPosition,
	backgroundRepeat,
	backgroundSize,
];
