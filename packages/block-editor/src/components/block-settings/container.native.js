/**
 * WordPress dependencies
 */
/**
 * External dependencies
 */
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
	InspectorControls,
	SETTINGS_DEFAULTS as defaultSettings,
} from '@wordpress/block-editor';
import { BottomSheet, ColorSettings } from '@wordpress/components';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { Animated, Easing } from 'react-native';
/**
 * Internal dependencies
 */
import styles from './container.native.scss';

const Stack = createStackNavigator();

function BottomSheetSettings( {
	editorSidebarOpened,
	closeGeneralSidebar,
	...props
} ) {
	const heightValue = useRef( new Animated.Value( 1 ) ).current;
	const setHeight = ( maxHeight ) => {
		if ( heightValue !== maxHeight ) {
			Animated.timing( heightValue, {
				toValue: maxHeight,
				duration: 200,
				easing: Easing.quad,
			} ).start();
		}
	};

	const MainScreen = useRef( () => (
		<BottomSheet.NavigationScreen setHeight={ setHeight } name={ 'main' }>
			<InspectorControls.Slot />
		</BottomSheet.NavigationScreen>
	) );

	const DetailsScreen = useRef( () => (
		<BottomSheet.NavigationScreen setHeight={ setHeight } name={ 'Color' }>
			<ColorSettings defaultSettings={ defaultSettings } />
		</BottomSheet.NavigationScreen>
	) );

	const backgroundStyle = usePreferredColorSchemeStyle(
		styles.background,
		styles.backgroundDark
	);

	const MyTheme = {
		...DefaultTheme,
		colors: {
			...DefaultTheme.colors,
			background: backgroundStyle.backgroundColor,
		},
	};
	return (
		<BottomSheet
			isVisible={ editorSidebarOpened }
			onClose={ closeGeneralSidebar }
			hideHeader
			contentStyle={ styles.content }
			adjustToContentHeight
			{ ...props }
		>
			<Animated.View style={ { height: heightValue } }>
				<NavigationContainer theme={ MyTheme }>
					<Stack.Navigator
						screenOptions={ {
							headerShown: false,
							gestureEnabled: false,
						} }
					>
						<Stack.Screen
							options={ BottomSheet.NavigationScreen.options }
							name="Settings"
							component={ MainScreen.current }
						/>
						<Stack.Screen
							options={ BottomSheet.NavigationScreen.options }
							name="Colors"
							component={ DetailsScreen.current }
						/>
					</Stack.Navigator>
				</NavigationContainer>
			</Animated.View>
		</BottomSheet>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );

		return {
			editorSidebarOpened: isEditorSidebarOpened(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { closeGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			closeGeneralSidebar,
		};
	} ),
] )( BottomSheetSettings );
