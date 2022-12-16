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
import { DEFAULT_SHORT_NAMES, DEFAULT_NAMES } from './constants';
import { hasValidShortName } from './utils';
import type { FontSizePickerToggleGroupProps } from './types';

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
							: DEFAULT_SHORT_NAMES[ index ]
					}
					aria-label={ fontSize.name || DEFAULT_NAMES[ index ] }
					showTooltip
				/>
			) ) }
		</ToggleGroupControl>
	);
};

export default FontSizePickerToggleGroup;
