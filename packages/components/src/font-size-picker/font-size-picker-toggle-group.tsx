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
			onChange={ ( newSlug ) => {
				if ( newSlug === undefined ) {
					onChange( undefined );
				} else {
					// Find the font size by slug and pass its size value
					const selectedFontSize = fontSizes.find(
						( fontSize ) => fontSize.slug === newSlug
					);
					if ( selectedFontSize ) {
						onChange( selectedFontSize.size );
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
