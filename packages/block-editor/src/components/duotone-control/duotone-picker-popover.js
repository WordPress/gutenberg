/**
 * WordPress dependencies
 */
import {
	Popover,
	MenuGroup,
	DuotonePicker,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function DuotonePickerPopover( {
	value,
	onChange,
	onToggle,
	duotonePalette,
	colorPalette,
	disableCustomColors,
	disableCustomDuotone,
	posterize,
	onPosterizeToggle,
} ) {
	return (
		<Popover
			className="block-editor-duotone-control__popover"
			headerTitle={ __( 'Duotone' ) }
			onFocusOutside={ onToggle }
		>
			<MenuGroup label={ __( 'Duotone' ) }>
				<DuotonePicker
					colorPalette={ colorPalette }
					duotonePalette={ duotonePalette }
					disableCustomColors={ disableCustomColors }
					disableCustomDuotone={ disableCustomDuotone }
					value={ value }
					onChange={ onChange }
				/>
				<ToggleControl
					checked={ posterize }
					onChange={ onPosterizeToggle }
					label={ __( 'Posterize' ) }
				/>
			</MenuGroup>
		</Popover>
	);
}

export default DuotonePickerPopover;
