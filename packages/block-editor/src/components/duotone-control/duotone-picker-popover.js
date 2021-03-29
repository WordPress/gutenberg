/**
 * WordPress dependencies
 */
import {
	CircularOptionPicker,
	Popover,
	MenuGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CustomDuotoneBar from './custom-duotone-bar';
import CustomDuotonePicker from './custom-duotone-picker';
import { getGradientFromCSSColors, getValuesFromColors } from './utils';

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
				<CircularOptionPicker
					options={ duotonePalette.map( ( option ) => {
						const isSelected = option.slug === value?.slug;
						const style = {
							background: getGradientFromCSSColors(
								option.colors,
								'135deg'
							),
							color: 'transparent',
						};
						const code = sprintf(
							// translators: %s: duotone code e.g: "dark-grayscale" or "7f7f7f-ffffff".
							__( 'Duotone code: %s' ),
							option.slug
						);
						const label = sprintf(
							// translators: %s: The name of the option e.g: "Dark grayscale".
							__( 'Duotone: %s' ),
							option.name
						);

						return (
							<CircularOptionPicker.Option
								key={ option.slug }
								value={ option.slug }
								isSelected={ isSelected }
								tooltipText={ option.name ?? code }
								style={ style }
								onClick={ () => {
									const newValue = {
										values: getValuesFromColors(
											option.colors
										),
										slug: option.slug,
									};
									onChange(
										isSelected ? undefined : newValue
									);
								} }
								aria-label={ option.name ? label : code }
							/>
						);
					} ) }
					actions={
						<CircularOptionPicker.ButtonAction
							onClick={ () => onChange( undefined ) }
						>
							{ __( 'Clear' ) }
						</CircularOptionPicker.ButtonAction>
					}
				>
					<CustomDuotoneBar value={ value } onChange={ onChange } />
					<CustomDuotonePicker
						colorPalette={ colorPalette }
						value={ value }
						onChange={ onChange }
					/>
				</CircularOptionPicker>
			</MenuGroup>
		</Popover>
	);
}

export default DuotonePickerPopover;
