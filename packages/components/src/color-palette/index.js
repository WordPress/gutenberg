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
import { ColorHeading } from './styles';

extend( [ namesPlugin, a11yPlugin ] );

function SinglePalette( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	actions,
} ) {
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
	return (
		<CircularOptionPicker
			className={ className }
			options={ colorOptions }
			actions={ actions }
		/>
	);
}

function MultiplePalettes( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	actions,
} ) {
	return (
		<VStack spacing={ 3 } className={ className }>
			{ colors.map( ( { name, colors: colorPalette }, index ) => {
				return (
					<VStack spacing={ 2 } key={ index }>
						<ColorHeading>{ name }</ColorHeading>
						<SinglePalette
							clearColor={ clearColor }
							colors={ colorPalette }
							onChange={ onChange }
							value={ value }
							actions={
								colors.length === index + 1 ? actions : null
							}
						/>
					</VStack>
				);
			} ) }
		</VStack>
	);
}

export default function ColorPalette( {
	clearable = true,
	className,
	colors,
	disableCustomColors = false,
	enableAlpha,
	onChange,
	value,
	__experimentalHasMultipleOrigins = false,
} ) {
	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );
	const Component = __experimentalHasMultipleOrigins
		? MultiplePalettes
		: SinglePalette;

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
					contentClassName="components-color-palette__custom-color-dropdown-content"
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
			<Component
				clearable={ clearable }
				clearColor={ clearColor }
				colors={ colors }
				onChange={ onChange }
				value={ value }
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
