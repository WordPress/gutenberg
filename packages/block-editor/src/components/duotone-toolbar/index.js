/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { noFilter } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import DuotonePickerPopover from './duotone-picker-popover';
import Swatch from './duotone-swatch';
import { getGradientFromValues } from './utils';

function DuotoneToolbar( { value, onChange, duotonePalette, colorPalette } ) {
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
			<ToolbarGroup>
				<ToolbarButton
					showTooltip
					onClick={ onToggle }
					aria-haspopup="true"
					aria-expanded={ isOpen }
					onKeyDown={ openOnArrowDown }
					label={ __( 'Change image duotone filter' ) }
					icon={
						value ? (
							<Swatch
								fill={ getGradientFromValues( value.values ) }
							/>
						) : (
							noFilter
						)
					}
				/>
			</ToolbarGroup>
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

export default DuotoneToolbar;
