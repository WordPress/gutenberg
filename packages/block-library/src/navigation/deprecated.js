/**
 * External dependencies
 */
import { mapValues, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const TYPOGRAPHY_PRESET_DEPRECATION_MAP = {
	fontStyle: 'var:preset|font-style|',
	fontWeight: 'var:preset|font-weight|',
	textDecoration: 'var:preset|text-decoration|',
	textTransform: 'var:preset|text-transform|',
};

export default [
	{
		attributes: {
			orientation: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
			rgbTextColor: {
				type: 'string',
			},
			backgroundColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			rgbBackgroundColor: {
				type: 'string',
			},
			itemsJustification: {
				type: 'string',
			},
			showSubmenuIcon: {
				type: 'boolean',
				default: true,
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
			inserter: true,
			fontSize: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalTextTransform: true,
			color: true,
			__experimentalFontFamily: true,
			__experimentalTextDecoration: true,
		},
		save() {
			return <InnerBlocks.Content />;
		},
		isEligible( attributes ) {
			if ( ! attributes.style || ! attributes.style.typography ) {
				return false;
			}
			for ( const styleAttribute in TYPOGRAPHY_PRESET_DEPRECATION_MAP ) {
				const attributeValue =
					attributes.style.typography[ styleAttribute ];
				if (
					attributeValue &&
					attributeValue.startsWith(
						TYPOGRAPHY_PRESET_DEPRECATION_MAP[ styleAttribute ]
					)
				) {
					return true;
				}
			}
			return false;
		},
		migrate( attributes ) {
			return {
				...attributes,
				style: {
					...attributes.style,
					typography: mapValues(
						attributes.style.typography,
						( value, key ) => {
							const prefix =
								TYPOGRAPHY_PRESET_DEPRECATION_MAP[ key ];
							if ( prefix && value.startsWith( prefix ) ) {
								const newValue = value.slice( prefix.length );
								if (
									'textDecoration' === key &&
									'strikethrough' === newValue
								) {
									return 'line-through';
								}
								return newValue;
							}
							return value;
						}
					),
				},
			};
		},
	},
	{
		attributes: {
			className: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			rgbTextColor: {
				type: 'string',
			},
			backgroundColor: {
				type: 'string',
			},
			rgbBackgroundColor: {
				type: 'string',
			},
			fontSize: {
				type: 'string',
			},
			customFontSize: {
				type: 'number',
			},
			itemsJustification: {
				type: 'string',
			},
			showSubmenuIcon: {
				type: 'boolean',
			},
		},
		isEligible( attribute ) {
			return attribute.rgbTextColor || attribute.rgbBackgroundColor;
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
			inserter: true,
		},
		migrate( attributes ) {
			return {
				...omit( attributes, [ 'rgbTextColor', 'rgbBackgroundColor' ] ),
				customTextColor: attributes.textColor
					? undefined
					: attributes.rgbTextColor,
				customBackgroundColor: attributes.backgroundColor
					? undefined
					: attributes.rgbBackgroundColor,
			};
		},
		save() {
			return <InnerBlocks.Content />;
		},
	},
];
