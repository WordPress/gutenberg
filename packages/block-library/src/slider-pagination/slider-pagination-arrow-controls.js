/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { chevronLeft, arrowLeft } from '@wordpress/icons';

export function SliderPaginationArrowControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Arrow' ) }
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
