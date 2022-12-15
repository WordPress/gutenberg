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

/**
 * hasValidShortName
 *
 * check that the font size short name is a string with at most
 * 3 characters length (e.g. "XXS", "XS", "S", "M", "L", "XL", "XXL")
 *
 * @param  shortName font size object
 * @return boolean
 */
function hasValidShortName( shortName: string | undefined ): boolean {
	return (
		typeof shortName === 'string' &&
		shortName.length >= 1 &&
		shortName.length <= 3
	);
}

const FontSizePickerToggleGroup = ( props: FontSizePickerToggleGroupProps ) => {
	const { fontSizes, value, __nextHasNoMarginBottom, size, onChange } = props;
	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			label={ __( 'Font size' ) }
			hideLabelFromVision
			value={ value }
			onChange={ onChange }
			isBlock
			size={ size }
		>
			{ fontSizes.map( ( fontSize, index ) => (
				<ToggleGroupControlOption
					key={ fontSize.slug }
					value={ fontSize.size }
					label={
						fontSize.shortName &&
						hasValidShortName( fontSize.shortName )
							? fontSize.shortName
							: T_SHIRT_ABBREVIATIONS[ index ]
					}
					aria-label={ fontSize.name || T_SHIRT_NAMES[ index ] }
					showTooltip
				/>
			) ) }
		</ToggleGroupControl>
	);
};

export default FontSizePickerToggleGroup;
