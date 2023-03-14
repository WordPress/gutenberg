/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import {
	BottomSheet,
	ColorSettings,
	FocalPointSettingsPanel,
	ImageLinkDestinationsScreen,
	LinkPickerScreen,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './container.native.scss';

export const blockSettingsScreens = {
	settings: 'Settings',
	color: 'Color',
	focalPoint: 'FocalPoint',
	linkPicker: 'linkPicker',
	imageLinkDestinations: 'imageLinkDestinations',
};

export default function BottomSheetSettings( props ) {
	const colorSettings = useMultipleOriginColorsAndGradients();
	const { closeGeneralSidebar } = useDispatch( 'core/edit-post' );
	const editorSidebarOpened = useSelect( ( select ) =>
		select( 'core/edit-post' ).isEditorSidebarOpened()
	);

	return (
		<BottomSheet
			isVisible={ editorSidebarOpened }
			onClose={ closeGeneralSidebar }
			hideHeader
			contentStyle={ styles.content }
			hasNavigation
			testID="block-settings-modal"
			{ ...props }
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen
					name={ blockSettingsScreens.settings }
				>
					<InspectorControls.Slot />
				</BottomSheet.NavigationScreen>
				<BottomSheet.NavigationScreen
					name={ BottomSheet.SubSheet.screenName }
				>
					<BottomSheet.SubSheet.Slot />
				</BottomSheet.NavigationScreen>

				<BottomSheet.NavigationScreen
					name={ blockSettingsScreens.color }
				>
					<ColorSettings defaultSettings={ colorSettings } />
				</BottomSheet.NavigationScreen>
				<BottomSheet.NavigationScreen
					name={ blockSettingsScreens.focalPoint }
					fullScreen
				>
					<FocalPointSettingsPanel />
				</BottomSheet.NavigationScreen>
				<BottomSheet.NavigationScreen
					name={ blockSettingsScreens.linkPicker }
					fullScreen
					isScrollable
				>
					<LinkPickerScreen
						returnScreenName={ blockSettingsScreens.settings }
					/>
				</BottomSheet.NavigationScreen>
				<BottomSheet.NavigationScreen
					name={ blockSettingsScreens.imageLinkDestinations }
				>
					<ImageLinkDestinationsScreen { ...props } />
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}
