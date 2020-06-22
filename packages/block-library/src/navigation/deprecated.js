/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default [
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
