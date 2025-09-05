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
	const { fontSizes, value, __next40pxDefaultSize, size, onChange } = props;
	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize={ __next40pxDefaultSize }
			__shouldNotWarnDeprecated36pxSize
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
					label={ T_SHIRT_ABBREVIATIONS[ index ] }
					aria-label={ fontSize.name || T_SHIRT_NAMES[ index ] }
					showTooltip
				/>
			) ) }
		</ToggleGroupControl>
	);
};

export default FontSizePickerToggleGroup;
