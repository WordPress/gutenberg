/**
 * WordPress dependencies
 */
import { ToolbarButton, DuotoneSwatch } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import DuotonePickerPopover from './duotone-picker-popover';

function DuotoneControl( {
	colorPalette,
	duotonePalette,
	disableCustomColors,
	value,
	onChange,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );

	if ( ! duotonePalette ) {
		return null;
	}

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
				icon={ <DuotoneSwatch values={ value } /> }
			/>
			{ isOpen && (
				<DuotonePickerPopover
					value={ value }
					onChange={ onChange }
					onToggle={ onToggle }
					duotonePalette={ duotonePalette }
					colorPalette={ colorPalette }
					disableCustomColors={ disableCustomColors }
				/>
			) }
		</>
	);
}

export default DuotoneControl;
