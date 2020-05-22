/**
 * External dependencies
 */
import { View, Text } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { ColorControl, PanelBody } from '@wordpress/components';
/**
 * Internal dependencies
 */
import ColorPicker from '../../color-picker';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import CustomGradientPicker from '../../custom-gradient-picker';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SegmentedControls from '../segmented-control';
import { colorsUtils } from './utils';
import { performLayoutAnimation } from '../utils';

import styles from './style.scss';

function ColorSettings( {
	label,
	onColorChange,
	onGradientChange,
	colorValue,
	onReplaceSubsheet,
	shouldEnableBottomSheetScroll,
	shouldDisableBottomSheetMaxHeight,
	isBottomSheetContentScrolling,
	onCloseBottomSheet,
	onHardwareButtonPress,
	defaultSettings,
} ) {
	const [ currentValue, setCurrentValue ] = useState( colorValue );
	const [ isCustomScreen, setIsCustomScreen ] = useState( false );
	const [ isCustomGradientScreen, setIsCustomGradientScreen ] = useState(
		false
	);

	const { segments, subsheets, isGradient } = colorsUtils;
	const isGradientColor = isGradient( currentValue );
	const selectedSegmentIndex = isGradientColor ? 1 : 0;

	const [ currentSegment, setCurrentSegment ] = useState(
		segments[ selectedSegmentIndex ]
	);

	const isSolidSegment = currentSegment === segments[ 0 ];
	const isCustomGadientShown = ! isSolidSegment && isGradientColor;

	const horizontalSeparatorStyle = usePreferredColorSchemeStyle(
		styles.horizontalSeparator,
		styles.horizontalSeparatorDark
	);

	useEffect( () => {
		onHardwareButtonPress( () => {
			if ( isCustomScreen ) {
				onCustomScreenToggle( false );
			} else {
				onReplaceSubsheet(
					subsheets[ 0 ],
					{},
					afterHardwareButtonPress()
				);
			}
		} );
	}, [ isCustomScreen ] );

	useEffect( () => {
		performLayoutAnimation();
	}, [ isCustomGadientShown ] );

	useEffect( () => {
		setCurrentSegment( segments[ selectedSegmentIndex ] );
		shouldDisableBottomSheetMaxHeight( true );
		onCloseBottomSheet( null );
	}, [] );

	function afterHardwareButtonPress() {
		onHardwareButtonPress( null );
		shouldDisableBottomSheetMaxHeight( true );
	}

	function onCustomScreenToggle( shouldShow ) {
		performLayoutAnimation();
		setIsCustomScreen( shouldShow );
	}

	function onCustomGradientScreenToggle( shouldShow ) {
		performLayoutAnimation();
		setIsCustomGradientScreen( shouldShow );
	}

	function onCustomPress() {
		if ( isSolidSegment ) {
			onCustomScreenToggle( true );
		} else onCustomGradientScreenToggle( true );
	}

	function setColor( color ) {
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
	}

	function getFooter() {
		if ( onGradientChange ) {
			return (
				<SegmentedControls
					segments={ segments }
					segmentHandler={ ( item ) => setCurrentSegment( item ) }
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
		<View renderToHardwareTextureAndroid>
			{ isCustomScreen && (
				<View>
					<ColorPicker
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
						shouldDisableBottomSheetMaxHeight={
							shouldDisableBottomSheetMaxHeight
						}
						setColor={ setColor }
						activeColor={ currentValue }
						isGradientColor={ isGradientColor }
						onNavigationBack={ () => {
							onCustomScreenToggle( false );
						} }
						onCloseBottomSheet={ onCloseBottomSheet }
						isBottomSheetContentScrolling={
							isBottomSheetContentScrolling
						}
					/>
				</View>
			) }
			{ ! isCustomScreen && ! isCustomGradientScreen && (
				<View>
					<NavigationHeader
						screen={ label }
						leftButtonOnPress={ () =>
							onReplaceSubsheet( subsheets[ 0 ] )
						}
					/>
					<ColorPalette
						setColor={ setColor }
						activeColor={ currentValue }
						isGradientColor={ isGradientColor }
						currentSegment={ currentSegment }
						isCustomScreen={ isCustomScreen }
						onCustomPress={ onCustomPress }
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
						defaultSettings={ defaultSettings }
					/>
					{ isCustomGadientShown && (
						<>
							<View style={ horizontalSeparatorStyle } />
							<PanelBody>
								<ColorControl
									label={ __( 'Customize Gradient' ) }
									onPress={ () =>
										onCustomGradientScreenToggle( true )
									}
									withColorIndicator={ false }
								/>
							</PanelBody>
						</>
					) }
					<View style={ horizontalSeparatorStyle } />
					{ getFooter() }
				</View>
			) }
			{ isCustomGradientScreen && (
				<View>
					<NavigationHeader
						screen={ __( 'Customize Gradient' ) }
						leftButtonOnPress={ () =>
							onCustomGradientScreenToggle( false )
						}
					/>
					<CustomGradientPicker
						setColor={ setColor }
						currentValue={ currentValue }
						isGradientColor={ isGradientColor }
					/>
				</View>
			) }
		</View>
	);
}

export default ColorSettings;
