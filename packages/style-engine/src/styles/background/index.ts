import type { Style, StyleOptions } from '../../types';
import { generateRule, getCSSValueFromRawStyle, safeDecodeURI } from '../utils';

const backgroundImage = {
	name: 'backgroundImage',
	generate: ( style: Style, options: StyleOptions ) => {
		const _backgroundImage = style?.background?.backgroundImage;
		const gradient =
			getCSSValueFromRawStyle( style?.background?.gradient ) || '';

		if ( ! _backgroundImage && ! gradient ) {
			return [];
		}

		const backgroundImageValue =
			typeof _backgroundImage === 'object' && _backgroundImage?.url
				? `url( '${ encodeURI(
						safeDecodeURI( _backgroundImage.url )
				  ) }' )`
				: getCSSValueFromRawStyle( _backgroundImage );
		const cssValue = [ gradient, backgroundImageValue ]
			.filter( Boolean )
			.join( ', ' );

		return !! cssValue
			? [
					{
						selector: options.selector,
						key: 'backgroundImage',
						value: cssValue,
					},
			  ]
			: [];
	},
};

const backgroundPosition = {
	name: 'backgroundPosition',
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
		return generateRule(
			style,
			options,
			[ 'background', 'backgroundSize' ],
			'backgroundSize'
		);
	},
};

const backgroundAttachment = {
	name: 'backgroundAttachment',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'background', 'backgroundAttachment' ],
			'backgroundAttachment'
		);
	},
};

const VALID_BACKGROUND_CLIP_VALUES = [
	'border-box',
	'padding-box',
	'content-box',
	'text',
];

const backgroundClip = {
	name: 'backgroundClip',
	generate: (
		style: Style,
		options: StyleOptions
	): ReturnType< typeof generateRule > => {
		const value = style?.background?.backgroundClip;

		if ( ! value || ! VALID_BACKGROUND_CLIP_VALUES.includes( value ) ) {
			return [];
		}

		const rules = [
			{
				selector: options.selector,
				key: 'backgroundClip',
				value,
			},
		];

		if ( value === 'text' ) {
			rules.push(
				{
					selector: options.selector,
					key: '-webkit-background-clip',
					value: 'text',
				},
				{
					selector: options.selector,
					key: '-webkit-text-fill-color',
					value: 'transparent',
				}
			);
		} else {
			// Only the fill colour is restored. `-webkit-background-clip` is
			// an alias of `background-clip` in Chromium, so resetting it here
			// would discard the value set above. The fill colour is inherited,
			// so it needs its initial value rather than `unset`, which would
			// take a transparent fill from an ancestor clipping to text.
			rules.push( {
				selector: options.selector,
				key: '-webkit-text-fill-color',
				value: 'currentColor',
			} );
		}

		return rules;
	},
};

export default [
	backgroundImage,
	backgroundPosition,
	backgroundRepeat,
	backgroundSize,
	backgroundAttachment,
	backgroundClip,
];
