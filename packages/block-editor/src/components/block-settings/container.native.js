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
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import styles from './container.native.scss';
import { store as blockEditorStore } from '../../store';

export const blockSettingsScreens = {
	settings: 'Settings',
	color: 'Color',
	focalPoint: 'FocalPoint',
	linkPicker: 'linkPicker',
	imageLinkDestinations: 'imageLinkDestinations',
};

function BottomSheetSettings( {
	editorSidebarOpened,
	closeGeneralSidebar,
	...props
} ) {
	const colorSettings = useMultipleOriginColorsAndGradients();

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

export default compose( [
	withSelect( ( select ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const { getSettings } = select( blockEditorStore );
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
