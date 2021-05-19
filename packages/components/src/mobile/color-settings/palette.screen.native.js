/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useContext } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	ColorControl,
	PanelBody,
	BottomSheetContext,
} from '@wordpress/components';
import { useRoute, useNavigation } from '@react-navigation/native';
/**
 * Internal dependencies
 */
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SegmentedControls from '../segmented-control';
import { colorsUtils } from './utils';

import styles from './style.scss';

const PaletteScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const { shouldEnableBottomSheetScroll } = useContext( BottomSheetContext );
	const {
		label,
		onColorChange,
		onGradientChange,
		colorValue,
		defaultSettings,
	} = route.params || {};
	const { segments, isGradient } = colorsUtils;
	const [ currentValue, setCurrentValue ] = useState( colorValue );
	const isGradientColor = isGradient( currentValue );
	const selectedSegmentIndex = isGradientColor ? 1 : 0;

	const [ currentSegment, setCurrentSegment ] = useState(
		segments[ selectedSegmentIndex ]
	);

	const horizontalSeparatorStyle = usePreferredColorSchemeStyle(
		styles.horizontalSeparator,
		styles.horizontalSeparatorDark
	);

	const isSolidSegment = currentSegment === segments[ 0 ];
	const isCustomGadientShown = ! isSolidSegment && isGradientColor;

	const setColor = ( color ) => {
		setCurrentValue( color );
		if ( isSolidSegment && onColorChange && onGradientChange ) {
			onColorChange( color );
			onGradientChange( '' );
		} else if ( isSolidSegment && onColorChange ) {
			onColorChange( color );
		} else if ( ! isSolidSegment && onGradientChange ) {
			onGradientChange( color );
			onColorChange( '' );
		}
	};

	function onCustomPress() {
		if ( isSolidSegment ) {
			navigation.navigate( colorsUtils.screens.picker, {
				currentValue,
				setColor,
			} );
		} else {
			navigation.navigate( colorsUtils.screens.gradientPicker, {
				setColor,
				isGradientColor,
				currentValue,
			} );
		}
	}

	function getFooter() {
		if ( onGradientChange ) {
			return (
				<SegmentedControls
					segments={ segments }
					segmentHandler={ setCurrentSegment }
					selectedIndex={ segments.indexOf( currentSegment ) }
					addonLeft={
						currentValue && (
							<ColorIndicator
								color={ currentValue }
								style={ styles.colorIndicator }
							/>
						)
					}
				/>
			);
		}
		return (
			<View style={ styles.footer }>
				<View style={ styles.flex }>
					{ currentValue && (
						<ColorIndicator
							color={ currentValue }
							style={ styles.colorIndicator }
						/>
					) }
				</View>
				<Text
					style={ styles.selectColorText }
					maxFontSizeMultiplier={ 2 }
				>
					{ __( 'Select a color' ) }
				</Text>
				<View style={ styles.flex } />
			</View>
		);
	}
	return (
		<View>
			<NavigationHeader
				screen={ label }
				leftButtonOnPress={ navigation.goBack }
			/>
			<ColorPalette
				setColor={ setColor }
				activeColor={ currentValue }
				isGradientColor={ isGradientColor }
				currentSegment={ currentSegment }
				onCustomPress={ onCustomPress }
				shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
				defaultSettings={ defaultSettings }
			/>
			{ isCustomGadientShown && (
				<>
					<View style={ horizontalSeparatorStyle } />
					<PanelBody>
						<ColorControl
							label={ __( 'Customize Gradient' ) }
							onPress={ onCustomPress }
							withColorIndicator={ false }
						/>
					</PanelBody>
				</>
			) }
			<View style={ horizontalSeparatorStyle } />
			{ getFooter() }
		</View>
	);
};

export default PaletteScreen;
