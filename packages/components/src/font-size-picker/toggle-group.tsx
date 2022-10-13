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
import type { FontSizePickerToggleGroupProps } from './types';

/**
 * In case we have at most five font sizes, show a `T-shirt size` alias as a
 * label of the font size. The label assumes that the font sizes are ordered
 * accordingly - from smallest to largest.
 */
const FONT_SIZES_ALIASES = [
	/* translators: S stands for 'small' and is a size label. */
	__( 'S' ),
	/* translators: M stands for 'medium' and is a size label. */
	__( 'M' ),
	/* translators: L stands for 'large' and is a size label. */
	__( 'L' ),
	/* translators: XL stands for 'extra large' and is a size label. */
	__( 'XL' ),
	/* translators: XXL stands for 'extra extra large' and is a size label. */
	__( 'XXL' ),
];

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
					label={ FONT_SIZES_ALIASES[ index ] }
					aria-label={ fontSize.name || FONT_SIZES_ALIASES[ index ] }
					showTooltip
				/>
			) ) }
		</ToggleGroupControl>
	);
};

export default FontSizePickerToggleGroup;
