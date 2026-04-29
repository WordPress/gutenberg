/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import {
	chevronLeft,
	arrowLeft,
	moreHorizontal,
	lineSolid,
} from '@wordpress/icons';

export function SliderPaginationArrowControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Button icon' ) }
			value={ value }
			onChange={ onChange }
			help={ __( 'Icon style for the previous and next slide buttons.' ) }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="chevron"
				icon={ chevronLeft }
				label={ __( 'Chevron' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="arrow"
				icon={ arrowLeft }
				label={ __( 'Arrow' ) }
			/>
		</ToggleGroupControl>
	);
}

export function SliderPaginationIndicatorControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Indicator icon' ) }
			value={ value }
			onChange={ onChange }
			help={ __( 'Shape of the indicators showing the current slide.' ) }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="dot"
				icon={ moreHorizontal }
				label={ __( 'Dot' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="line"
				icon={ lineSolid }
				label={ __( 'Line' ) }
			/>
		</ToggleGroupControl>
	);
}
