/**
 * WordPress dependencies
 */
/**
 * External dependencies
 */
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { InspectorControls } from '@wordpress/block-editor';
import { BottomSheet, ColorSettings } from '@wordpress/components';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import styles from './container.native.scss';

const Stack = createStackNavigator();

function BottomSheetSettings( {
	editorSidebarOpened,
	closeGeneralSidebar,
	settings,
	...props
} ) {
	const MainScreen = useRef( () => (
		<BottomSheet.NavigationScreen>
			<InspectorControls.Slot />
		</BottomSheet.NavigationScreen>
	) );

	const DetailsScreen = useRef( () => (
		<BottomSheet.NavigationScreen>
			<ColorSettings defaultSettings={ settings } />
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
			{ ...props }
		>
			<BottomSheet.NavigationContainer animate>
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
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const { getSettings } = select( 'core/block-editor' );
		return {
			settings: getSettings(),
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
