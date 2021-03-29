/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { swatch } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import DuotonePickerPopover from './duotone-picker-popover';
import Swatch from './duotone-swatch';
import { getGradientFromValues } from './utils';

function DuotoneControl( { value, onChange, duotonePalette, colorPalette } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const onToggle = () => {
		setIsOpen( ( prev ) => ! prev );
	};
	const openOnArrowDown = ( event ) => {
		if ( ! isOpen && event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			onToggle();
		}
	};
	return (
		<>
			<ToolbarButton
				showTooltip
				onClick={ onToggle }
				aria-haspopup="true"
				aria-expanded={ isOpen }
				onKeyDown={ openOnArrowDown }
				label={ __( 'Apply duotone filter' ) }
				icon={
					value ? (
						<Swatch
							fill={ getGradientFromValues(
								value.values,
								'135deg'
							) }
						/>
					) : (
						swatch
					)
				}
			/>
			{ isOpen && (
				<DuotonePickerPopover
					value={ value }
					onChange={ onChange }
					onToggle={ onToggle }
					duotonePalette={ duotonePalette }
					colorPalette={ colorPalette }
				/>
			) }
		</>
	);
}

export default DuotoneControl;
