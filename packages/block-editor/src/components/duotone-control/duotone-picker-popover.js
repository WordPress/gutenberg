/**
 * WordPress dependencies
 */
import { Popover, MenuGroup, DuotonePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function DuotonePickerPopover( {
	value,
	onChange,
	onToggle,
	duotonePalette,
	colorPalette,
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
					value={ value }
					onChange={ onChange }
				/>
			</MenuGroup>
		</Popover>
	);
}

export default DuotonePickerPopover;
