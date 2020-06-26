/**
 * External dependencies
 */
import { map } from 'lodash';
import tinycolor from 'tinycolor2';
import {
	useDisclosureState,
	Disclosure,
	DisclosureContent,
} from 'reakit/Disclosure';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import { Flex, FlexItem } from '../flex';
import ColorPicker from '../color-picker';
import Spacer from '../spacer';
import CircularOptionPicker from '../circular-option-picker';

export default function ColorPalette( {
	clearable = true,
	className,
	colors,
	disableCustomColors = false,
	onChange,
	value,
	__experimentalDisableCustomColorsPopover: disableCustomColorsPopover = false,
} ) {
	const disclosure = useDisclosureState();
	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );

	const colorOptions = useMemo( () => {
		return map( colors, ( { color, name } ) => (
			<CircularOptionPicker.Option
				key={ color }
				isSelected={ value === color }
				selectedIconProps={
					value === color
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
		<>
			<CircularOptionPicker
				className={ className }
				options={ colorOptions }
				actions={
					<>
						{ ! disableCustomColors &&
							! disableCustomColorsPopover && (
								<CircularOptionPicker.DropdownLinkAction
									dropdownProps={ {
										renderContent: renderCustomColorPicker,
										contentClassName:
											'components-color-palette__picker',
									} }
									buttonProps={ {
										'aria-label': __(
											'Custom color picker'
										),
									} }
									linkText={ __( 'Custom color' ) }
								/>
							) }
						<Flex justify="flex-end">
							{ ! disableCustomColors &&
								disableCustomColorsPopover && (
									<FlexItem>
										<Disclosure
											{ ...disclosure }
											as={ Button }
											isSmall
											isSecondary
										>
											{ __( 'Custom color' ) }
										</Disclosure>
									</FlexItem>
								) }
							{ !! clearable && (
								<FlexItem>
									<CircularOptionPicker.ButtonAction
										onClick={ clearColor }
									>
										{ __( 'Clear' ) }
									</CircularOptionPicker.ButtonAction>
								</FlexItem>
							) }
						</Flex>
					</>
				}
			/>
			{ ! disableCustomColors && disableCustomColorsPopover && (
				<DisclosureContent { ...disclosure }>
					<Spacer pb={ 0 } pt={ 3 }>
						<ColorPicker
							color={ value }
							onChangeComplete={ ( color ) =>
								onChange( color.hex )
							}
							disableAlpha
						/>
					</Spacer>
				</DisclosureContent>
			) }
		</>
	);
}
