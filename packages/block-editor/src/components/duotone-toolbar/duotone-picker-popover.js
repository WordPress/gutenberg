/**
 * WordPress dependencies
 */
import { CircularOptionPicker, Popover } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CustomDuotonePicker from './custom-duotone-picker';
import { getGradientFromCSSColors, getValuesFromHexColors } from './utils';

function DuotonePickerPopover( {
	value,
	onChange,
	onToggle,
	duotonePalette,
	colorPalette,
} ) {
	return (
		<Popover
			className="block-editor-duotone-toolbar__popover"
			headerTitle={ __( 'Duotone Presets' ) }
			onFocusOutside={ onToggle }
		>
			<span className="block-editor-duotone-toolbar__label">
				{ __( 'Duotone Presets' ) }
			</span>
			<CircularOptionPicker
				options={ duotonePalette.map( ( option ) => {
					const isSelected = option.slug === value?.slug;
					const style = {
						background: getGradientFromCSSColors( option.colors ),
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
									values: getValuesFromHexColors(
										option.colors
									),
									id: `duotone-filter-${ option.slug }`,
								};
								onChange( isSelected ? undefined : newValue );
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
				<CustomDuotonePicker
					colorPalette={ colorPalette }
					value={ value }
					onChange={ onChange }
				/>
			</CircularOptionPicker>
			<div className="block-editor-duotone-toolbar__description">
				{ __(
					'The duotone filter creates a two-color version of your image, where you choose the colors.'
				) }
			</div>
		</Popover>
	);
}

export default DuotonePickerPopover;
