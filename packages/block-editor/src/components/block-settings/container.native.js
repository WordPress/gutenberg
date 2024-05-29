/**
 * WordPress dependencies
 */
import {
	BottomSheet,
	ColorSettings,
	FocalPointSettingsPanel,
	LinkPickerScreen,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './container.native.scss';
import InspectorControls from '../inspector-controls';
import ImageLinkDestinationsScreen from '../image-link-destinations';
import useMultipleOriginColorsAndGradients from '../colors-gradients/use-multiple-origin-colors-and-gradients';
import { useMobileGlobalStylesColors } from '../global-styles/use-global-styles-context';
import AdvancedControls from '../inspector-controls-tabs/advanced-controls-panel';

export const blockSettingsScreens = {
	settings: 'Settings',
	color: 'Color',
	focalPoint: 'FocalPoint',
	linkPicker: 'linkPicker',
	imageLinkDestinations: 'imageLinkDestinations',
};

export default function BottomSheetSettings( props ) {
	const colorSettings = useMultipleOriginColorsAndGradients();
	colorSettings.allAvailableColors = useMobileGlobalStylesColors();
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
					<>
						<InspectorControls.Slot />
						<AdvancedControls />
					</>
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
