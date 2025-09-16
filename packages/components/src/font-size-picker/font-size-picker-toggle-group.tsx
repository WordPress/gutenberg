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
		selectedSlug,
		__next40pxDefaultSize,
		size,
		onChange,
	} = props;

	// Find the current value by slug if selectedSlug is provided, otherwise use the size value
	const currentValue = ( () => {
		if ( ! value ) {
			return undefined;
		}

		// If selectedSlug is provided, use it to find the exact font size
		if ( selectedSlug ) {
			const fontSizeBySlug = fontSizes.find(
				( fontSize ) => fontSize.slug === selectedSlug
			);
			if ( fontSizeBySlug ) {
				return fontSizeBySlug.slug;
			}
		}

		// Fallback to finding by size value - this is the current behavior
		// If multiple font sizes have the same size value, we can't distinguish them
		// without the selectedSlug, so we return undefined to avoid incorrect selection

		// Check if there are multiple font sizes with the same size value
		const matchingFontSizes = fontSizes.filter(
			( fontSize ) => fontSize.size === value
		);

		// If there are multiple matches and no selectedSlug, return undefined
		// to avoid selecting the wrong font size
		if ( matchingFontSizes.length > 1 && ! selectedSlug ) {
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
					// Find the font size by slug and pass both the size value and the slug
					const selectedFontSize = fontSizes.find(
						( fontSize ) => fontSize.slug === String( newSlug )
					);
					if ( selectedFontSize ) {
						onChange(
							selectedFontSize.size as number | string,
							String( newSlug )
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
