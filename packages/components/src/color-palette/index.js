/**
 * External dependencies
 */
import { map, startsWith } from 'lodash';
import tinycolor from 'tinycolor2';

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
	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );
	function match( val, color, slug ) {
		if ( startsWith( val, 'var:' ) ) {
			val = /var:preset\|color\|(.+)/.exec( val ).pop();
		}
		if ( val === color || val === slug ) {
			return true;
		}
		return false;
	}
	const colorOptions = useMemo( () => {
		return map( colors, ( { color, name, slug } ) => (
			<CircularOptionPicker.Option
				key={ color }
				isSelected={ match( value, color, slug ) }
				selectedIconProps={
					match( value, color, slug )
						? {
								fill: tinycolor
									.mostReadable( color, [ '#000', '#fff' ] )
									.toHexString(),
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
					match( value, color, slug )
						? clearColor
						: () => onChange( `var:preset|color|${ slug }` )
				}
				aria-label={
					name
						? // translators: %s: The name of the color e.g: "vivid red".
						  sprintf( __( 'Color: %s' ), name )
						: // translators: %s: color hex code e.g: "#f00".
						  sprintf( __( 'Color code: %s' ), color )
				}
			/>
		) );
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
