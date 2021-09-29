/**
 * External dependencies
 */
import { map } from 'lodash';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPicker from '../color-picker';
import CircularOptionPicker from '../circular-option-picker';

extend( [ namesPlugin, a11yPlugin ] );

export default function ColorPalette( {
	clearable = true,
	className,
	colors,
	disableCustomColors = false,
	onChange,
	value,
} ) {
	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );
	const colorOptions = useMemo( () => {
		return map( colors, ( { color, name } ) => {
			const colordColor = colord( color );
			return (
				<CircularOptionPicker.Option
					key={ color }
					isSelected={ value === color }
					selectedIconProps={
						value === color
							? {
									fill:
										colordColor.contrast() >
										colordColor.contrast( '#000' )
											? '#fff'
											: '#000',
							  }
							: {}
					}
					tooltipText={
						name ||
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
					style={ { backgroundColor: color, color } }
					onClick={
						value === color ? clearColor : () => onChange( color )
					}
					aria-label={
						name
							? // translators: %s: The name of the color e.g: "vivid red".
							  sprintf( __( 'Color: %s' ), name )
							: // translators: %s: color hex code e.g: "#f00".
							  sprintf( __( 'Color code: %s' ), color )
					}
				/>
			);
		} );
	}, [ colors, value, onChange, clearColor ] );
	const renderCustomColorPicker = () => (
		<ColorPicker
			color={ value }
			onChangeComplete={ ( color ) => onChange( color.hex ) }
			disableAlpha
		/>
	);

	return (
		<CircularOptionPicker
			className={ className }
			options={ colorOptions }
			actions={
				<>
					{ ! disableCustomColors && (
						<CircularOptionPicker.DropdownLinkAction
							dropdownProps={ {
								renderContent: renderCustomColorPicker,
								contentClassName:
									'components-color-palette__picker',
							} }
							buttonProps={ {
								'aria-label': __( 'Custom color picker' ),
							} }
							linkText={ __( 'Custom color' ) }
						/>
					) }
					{ !! clearable && (
						<CircularOptionPicker.ButtonAction
							onClick={ clearColor }
						>
							{ __( 'Clear' ) }
						</CircularOptionPicker.ButtonAction>
					) }
				</>
			}
		/>
	);
}
