/**
 * WordPress dependencies
 */
/**
 * External dependencies
 */
import { DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { InspectorControls } from '@wordpress/block-editor';
import { BottomSheet, ColorSettings } from '@wordpress/components';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import styles from './container.native.scss';

const Stack = createStackNavigator();

export const blockSettingsScreens = {
	settings: 'Settings',
	color: 'Color',
};

function BottomSheetSettings( {
	editorSidebarOpened,
	closeGeneralSidebar,
	settings,
	...props
} ) {
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
			<BottomSheet.NavigationContainer
				animate
				main
				theme={ MyTheme }
				stack={ Stack }
			>
				{ BottomSheet.NavigationScreen( {
					name: blockSettingsScreens.settings,
					stack: Stack,
					children: <InspectorControls.Slot />,
				} ) }
				{ BottomSheet.NavigationScreen( {
					name: blockSettingsScreens.color,
					stack: Stack,
					children: <ColorSettings defaultSettings={ settings } />,
				} ) }
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
