/**
 * External dependencies
 */
import { View, Text } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
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
	getStylesFromColorScheme,
} ) {
	const [ segment, setSegment ] = useState( 'Solid' );

	const horizontalSeparatorStyle = getStylesFromColorScheme(
		styles.horizontalSeparator,
		styles.horizontalSeparatorDark
	);

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
					<View style={ horizontalSeparatorStyle } />
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
					<View style={ horizontalSeparatorStyle } />
					<View style={ styles.footer }>
						<View style={ styles.flex }>
							<ColorIndicator
								color={ textColor }
								style={ styles.colorIndicator }
							/>
						</View>
						<Text style={ styles.selectColorText }>
							{ __( 'Select a color' ) }
						</Text>
						<View style={ styles.flex } />
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

export default withPreferredColorScheme( ColorSettings );
