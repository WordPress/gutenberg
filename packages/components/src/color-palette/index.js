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
import Dropdown from '../dropdown';
import { ColorPicker } from '../color-picker';
import CircularOptionPicker from '../circular-option-picker';
import { VStack } from '../v-stack';

extend( [ namesPlugin, a11yPlugin ] );

export default function ColorPalette( {
	clearable = true,
	className,
	colors,
	disableCustomColors = false,
	enableAlpha,
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
			onChange={ ( color ) => onChange( color ) }
			enableAlpha={ enableAlpha }
		/>
	);

	return (
		<VStack spacing={ 3 } className={ className }>
			{ ! disableCustomColors && (
				<Dropdown
					renderContent={ renderCustomColorPicker }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<button
							className="components-color-palette__custom-color"
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
							aria-label={ __( 'Custom color picker' ) }
							style={ { background: value } }
						>
							{ value }
						</button>
					) }
				/>
			) }
			<CircularOptionPicker
				options={ colorOptions }
				actions={
					!! clearable && (
						<CircularOptionPicker.ButtonAction
							onClick={ clearColor }
						>
							{ __( 'Clear' ) }
						</CircularOptionPicker.ButtonAction>
					)
				}
			/>
		</VStack>
	);
}
