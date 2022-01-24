/**
 * External dependencies
 */
import { mapValues, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

const TYPOGRAPHY_PRESET_DEPRECATION_MAP = {
	fontStyle: 'var:preset|font-style|',
	fontWeight: 'var:preset|font-weight|',
	textDecoration: 'var:preset|text-decoration|',
	textTransform: 'var:preset|text-transform|',
};

const migrateIdToRef = ( { navigationMenuId, ...attributes } ) => {
	return {
		...attributes,
		ref: navigationMenuId,
	};
};

const migrateWithLayout = ( attributes ) => {
	if ( !! attributes.layout ) {
		return attributes;
	}

	const {
		itemsJustification,
		orientation,
		...updatedAttributes
	} = attributes;

	if ( itemsJustification || orientation ) {
		Object.assign( updatedAttributes, {
			layout: {
				type: 'flex',
				...( itemsJustification && {
					justifyContent: itemsJustification,
				} ),
				...( orientation && { orientation } ),
			},
		} );
	}

	return updatedAttributes;
};

const v6 = {
	attributes: {
		navigationMenuId: {
			type: 'number',
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
		showSubmenuIcon: {
			type: 'boolean',
			default: true,
		},
		openSubmenusOnClick: {
			type: 'boolean',
			default: false,
		},
		overlayMenu: {
			type: 'string',
			default: 'mobile',
		},
		__unstableLocation: {
			type: 'string',
		},
		overlayBackgroundColor: {
			type: 'string',
		},
		customOverlayBackgroundColor: {
			type: 'string',
		},
		overlayTextColor: {
			type: 'string',
		},
		customOverlayTextColor: {
			type: 'string',
		},
	},
	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
		inserter: true,
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalTextTransform: true,
			__experimentalFontFamily: true,
			__experimentalTextDecoration: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		spacing: {
			blockGap: true,
			units: [ 'px', 'em', 'rem', 'vh', 'vw' ],
			__experimentalDefaultControls: {
				blockGap: true,
			},
		},
		__experimentalLayout: {
			allowSwitching: false,
			allowInheriting: false,
			default: {
				type: 'flex',
			},
		},
	},
	save() {
		return <InnerBlocks.Content />;
	},
	isEligible: ( { navigationMenuId } ) => !! navigationMenuId,
	migrate: migrateIdToRef,
};

const v5 = {
	attributes: {
		navigationMenuId: {
			type: 'number',
		},
		orientation: {
			type: 'string',
			default: 'horizontal',
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
		openSubmenusOnClick: {
			type: 'boolean',
			default: false,
		},
		overlayMenu: {
			type: 'string',
			default: 'never',
		},
		__unstableLocation: {
			type: 'string',
		},
		overlayBackgroundColor: {
			type: 'string',
		},
		customOverlayBackgroundColor: {
			type: 'string',
		},
		overlayTextColor: {
			type: 'string',
		},
		customOverlayTextColor: {
			type: 'string',
		},
	},
	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
		inserter: true,
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalTextTransform: true,
			__experimentalFontFamily: true,
			__experimentalTextDecoration: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		spacing: {
			blockGap: true,
			units: [ 'px', 'em', 'rem', 'vh', 'vw' ],
			__experimentalDefaultControls: {
				blockGap: true,
			},
		},
	},
	save() {
		return <InnerBlocks.Content />;
	},
	isEligible: ( { itemsJustification, orientation } ) =>
		!! itemsJustification || !! orientation,
	migrate: compose( migrateIdToRef, migrateWithLayout ),
};

const v4 = {
	attributes: {
		orientation: {
			type: 'string',
			default: 'horizontal',
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
		openSubmenusOnClick: {
			type: 'boolean',
			default: false,
		},
		overlayMenu: {
			type: 'string',
			default: 'never',
		},
		__unstableLocation: {
			type: 'string',
		},
		overlayBackgroundColor: {
			type: 'string',
		},
		customOverlayBackgroundColor: {
			type: 'string',
		},
		overlayTextColor: {
			type: 'string',
		},
		customOverlayTextColor: {
			type: 'string',
		},
	},
	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
		inserter: true,
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalTextTransform: true,
			__experimentalFontFamily: true,
			__experimentalTextDecoration: true,
		},
		spacing: {
			blockGap: true,
			units: [ 'px', 'em', 'rem', 'vh', 'vw' ],
			__experimentalDefaultControls: {
				blockGap: true,
			},
		},
	},
	save() {
		return <InnerBlocks.Content />;
	},
	migrate: compose( migrateIdToRef, migrateWithLayout, migrateFontFamily ),
	isEligible( { style } ) {
		return style?.typography?.fontFamily;
	},
};

const migrateIsResponsive = function ( attributes ) {
	delete attributes.isResponsive;
	return {
		...attributes,
		overlayMenu: 'mobile',
	};
};

const migrateTypographyPresets = function ( attributes ) {
	return {
		...attributes,
		style: {
			...attributes.style,
			typography: mapValues(
				attributes.style.typography,
				( value, key ) => {
					const prefix = TYPOGRAPHY_PRESET_DEPRECATION_MAP[ key ];
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
};

const deprecated = [
	v6,
	v5,
	v4,
	// Remove `isResponsive` attribute.
	{
		attributes: {
			orientation: {
				type: 'string',
				default: 'horizontal',
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
			openSubmenusOnClick: {
				type: 'boolean',
				default: false,
			},
			isResponsive: {
				type: 'boolean',
				default: 'false',
			},
			__unstableLocation: {
				type: 'string',
			},
			overlayBackgroundColor: {
				type: 'string',
			},
			customOverlayBackgroundColor: {
				type: 'string',
			},
			overlayTextColor: {
				type: 'string',
			},
			customOverlayTextColor: {
				type: 'string',
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
			inserter: true,
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
				__experimentalTextTransform: true,
				__experimentalFontFamily: true,
				__experimentalTextDecoration: true,
			},
		},
		isEligible( attributes ) {
			return attributes.isResponsive;
		},
		migrate: compose(
			migrateIdToRef,
			migrateWithLayout,
			migrateFontFamily,
			migrateIsResponsive
		),
		save() {
			return <InnerBlocks.Content />;
		},
	},
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
		migrate: compose(
			migrateIdToRef,
			migrateWithLayout,
			migrateFontFamily,
			migrateTypographyPresets
		),
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
		migrate: compose( migrateIdToRef, ( attributes ) => {
			return {
				...omit( attributes, [ 'rgbTextColor', 'rgbBackgroundColor' ] ),
				customTextColor: attributes.textColor
					? undefined
					: attributes.rgbTextColor,
				customBackgroundColor: attributes.backgroundColor
					? undefined
					: attributes.rgbBackgroundColor,
			};
		} ),
		save() {
			return <InnerBlocks.Content />;
		},
	},
];

export default deprecated;
