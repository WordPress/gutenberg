/**
 * WordPress dependencies
 */
import {
	Dropdown,
	DuotonePicker,
	DuotoneSwatch,
	MenuGroup,
	ToolbarButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

function DuotoneControl( {
	colorPalette,
	duotonePalette,
	disableCustomColors,
	disableCustomDuotone,
	value,
	onChange,
} ) {
	return (
		<Dropdown
			popoverProps={ {
				className: 'block-editor-duotone-control__popover',
				headerTitle: __( 'Duotone' ),
				isAlternate: true,
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						onToggle();
					}
				};
				return (
					<ToolbarButton
						showTooltip
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onKeyDown={ openOnArrowDown }
						label={ __( 'Apply duotone filter' ) }
						icon={ <DuotoneSwatch values={ value } /> }
					/>
				);
			} }
			renderContent={ () => (
				<MenuGroup label={ __( 'Duotone' ) }>
					<div className="block-editor-duotone-control__description">
						{ __(
							'Create a two-tone color effect without losing your original image.'
						) }
					</div>
					<DuotonePicker
						colorPalette={ colorPalette }
						duotonePalette={ duotonePalette }
						disableCustomColors={ disableCustomColors }
						disableCustomDuotone={ disableCustomDuotone }
						value={ value }
						onChange={ onChange }
					/>
				</MenuGroup>
			) }
		/>
	);
}

export default DuotoneControl;
