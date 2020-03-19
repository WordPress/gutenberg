/**
 * External dependencies
 */
import { View, Text } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import ColorPicker from '../../color-picker';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SegmentedControls from '../segmented-control';

import styles from './style.scss';

function ColorSettings( {
	screen,
	changeBottomSheetContent,
	backgroundColor,
	setBackgroundColor,
	clientId,
	textColor,
	setTextColor,
	previousScreen,
	shouldEnableBottomSheetScroll,
	isBottomSheetScrolling,
	onCloseBottomSheet,
} ) {
	const [ segment, setSegment ] = useState( 'Solid' );

	useEffect( () => {
		setSegment( 'Solid' );
	}, [ screen ] );

	function getColorPalette() {
		return (
			<ColorPalette
				setBackgroundColor={ setBackgroundColor }
				setTextColor={ setTextColor }
				backgroundColor={ backgroundColor }
				textColor={ textColor }
				currentSegment={ segment }
				currentScreen={ screen }
				clientId={ clientId }
				onCustomPress={ () => changeBottomSheetContent( 'Custom' ) }
			/>
		);
	}

	return (
		<View>
			{ screen === 'Background' && (
				<View>
					<NavigationHeader
						screen={ screen }
						leftButtonOnPress={ () =>
							changeBottomSheetContent( 'Settings' )
						}
					/>
					{ getColorPalette() }
					<View style={ styles.horizontalSeparator } />
					<SegmentedControls
						segments={ [ 'Solid', 'Gradient' ] }
						segmentHandler={ ( item ) => setSegment( item ) }
						addonLeft={
							<ColorIndicator
								color={ backgroundColor }
								style={ styles.colorIndicator }
							/>
						}
					/>
				</View>
			) }
			{ screen === 'Text' && (
				<View>
					<NavigationHeader
						screen={ screen }
						leftButtonOnPress={ () =>
							changeBottomSheetContent( 'Settings' )
						}
					/>
					{ getColorPalette() }
					<View style={ styles.horizontalSeparator } />
					<View style={ styles.textFooter }>
						<ColorIndicator
							color={ textColor }
							style={ styles.absoluteColorIndicator }
						/>
						<Text style={ styles.selectColorText }>
							{ __( 'Select a color' ) }
						</Text>
					</View>
				</View>
			) }
			{ screen === 'Custom' && (
				<View>
					<ColorPicker
						previousScreen={ previousScreen }
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
						isBottomSheetScrolling={ isBottomSheetScrolling }
						setTextColor={ setTextColor }
						setBackgroundColor={ setBackgroundColor }
						backgroundColor={ backgroundColor }
						textColor={ textColor }
						onNavigationBack={ () =>
							changeBottomSheetContent( previousScreen )
						}
						clientId={ clientId }
						onCloseBottomSheet={ onCloseBottomSheet }
					/>
				</View>
			) }
		</View>
	);
}

export default ColorSettings;
