/**
 * External dependencies
 */
import { map } from 'lodash';

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

export default function ColorPalette( {
	clearable = true,
	className,
	colors,
	disableCustomColors = false,
	onChange,
	value,
} ) {
	const clearColor = useCallback(
		() => onChange( undefined ),
		[ onChange ]
	);
	const colorOptions = useMemo(
		() => {
			return map( colors, ( { color, name } ) => (
				<CircularOptionPicker.Option
					key={ color }
					isSelected={ value === color }
					tooltipText={ name ||
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
					style={ { color } }
					onClick={ value === color ? clearColor : () => onChange( color ) }
					aria-label={ name ?
						// translators: %s: The name of the color e.g: "vivid red".
						sprintf( __( 'Color: %s' ), name ) :
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
				/>
			) );
		},
		[ colors, value, onChange, clearColor ]
	);
	const renderCustomColorPicker = useCallback(
		() => (
			<ColorPicker
				color={ value }
				onChangeComplete={ ( color ) => onChange( color.hex ) }
				disableAlpha
			/>
		),
		[ value ]
	);

	return (
		<CircularOptionPicker
			className={ className }
			options={ colorOptions }
			actions={ (
				<>
					{ ! disableCustomColors && (
						<CircularOptionPicker.DropdownLinkAction
							dropdownProps={ {
								renderContent: renderCustomColorPicker,
								contentClassName: 'components-color-palette__picker',
							} }
							buttonProps={ {
								'aria-label': __( 'Custom color picker' ),
							} }
							linkText={ __( 'Custom Color' ) }
						/>
					) }
					{ !! clearable && (
						<CircularOptionPicker.ButtonAction onClick={ clearColor }>
							{ __( 'Clear' ) }
						</CircularOptionPicker.ButtonAction>
					) }
				</>
			) }
		/>
	);
}
