/**
 * WordPress dependencies
 */
import {
	ColorIndicator,
	Dropdown,
	DuotonePicker,
	DuotoneSwatch,
	MenuGroup,
	ToolbarButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import { Icon, filter } from '@wordpress/icons';

function DuotoneControl( {
	colorPalette,
	duotonePalette,
	disableCustomColors,
	disableCustomDuotone,
	value,
	onChange,
} ) {
	let toolbarIcon;
	if ( value === 'unset' ) {
		toolbarIcon = (
			<ColorIndicator className="block-editor-duotone-control__unset-indicator" />
		);
	} else if ( value ) {
		toolbarIcon = <DuotoneSwatch values={ value } />;
	} else {
		toolbarIcon = <Icon icon={ filter } />;
	}
	return (
		<Dropdown
			popoverProps={ {
				className: 'block-editor-duotone-control__popover',
				headerTitle: __( 'Duotone' ),
				variant: 'toolbar',
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
						icon={ toolbarIcon }
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
