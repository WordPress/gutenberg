/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
} from '../toggle-group-control';
import { T_SHIRT_ABBREVIATIONS, T_SHIRT_NAMES } from './constants';
import type { FontSizePickerToggleGroupProps } from './types';

const FontSizePickerToggleGroup = ( props: FontSizePickerToggleGroupProps ) => {
	const {
		fontSizes,
		value,
		valueMode = 'literal',
		__next40pxDefaultSize,
		size,
		onChange,
	} = props;

	// Find the current value based on valueMode
	const currentValue = ( () => {
		if ( ! value ) {
			return undefined;
		}

		// If valueMode is 'slug', the value is already the slug
		if ( valueMode === 'slug' ) {
			return String( value );
		}

		// If valueMode is 'literal', find the font size by size value
		// If multiple font sizes have the same size value, we can't distinguish them
		// without additional information, so we return undefined to avoid incorrect selection
		const matchingFontSizes = fontSizes.filter(
			( fontSize ) => fontSize.size === value
		);

		// If there are multiple matches, return undefined to avoid selecting the wrong font size
		if ( matchingFontSizes.length > 1 ) {
			return undefined;
		}

		// Find the font size by size value
		const fontSizeBySize = fontSizes.find(
			( fontSize ) => fontSize.size === value
		);

		return fontSizeBySize?.slug;
	} )();

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize={ __next40pxDefaultSize }
			__shouldNotWarnDeprecated36pxSize
			label={ __( 'Font size' ) }
			hideLabelFromVision
			value={ currentValue }
			onChange={ ( newSlug: string | number | undefined ) => {
				if ( newSlug === undefined ) {
					onChange( undefined );
				} else {
					// Find the font size by slug
					const selectedFontSize = fontSizes.find(
						( fontSize ) => fontSize.slug === String( newSlug )
					);
					if ( selectedFontSize ) {
						onChange(
							selectedFontSize.size as number | string,
							selectedFontSize
						);
					}
				}
			} }
			isBlock
			size={ size }
		>
			{ fontSizes.map( ( fontSize, index ) => (
				<ToggleGroupControlOption
					key={ fontSize.slug }
					value={ fontSize.slug }
					label={ T_SHIRT_ABBREVIATIONS[ index ] }
					aria-label={ fontSize.name || T_SHIRT_NAMES[ index ] }
					showTooltip
				/>
			) ) }
		</ToggleGroupControl>
	);
};

export default FontSizePickerToggleGroup;
