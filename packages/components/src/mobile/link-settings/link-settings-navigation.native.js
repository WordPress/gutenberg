/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';
import LinkSettingsScreen from './link-settings-screen';
import LinkPickerScreen from '../link-picker/link-picker-screen';

const linkSettingsScreens = {
	settings: 'LinkSettingsScreen',
	linkPicker: 'linkPicker',
};

function LinkSettingsNavigation( props ) {
	if ( ! props.withBottomSheet ) {
		return <LinkSettingsScreen { ...props } />;
	}
	return (
		<BottomSheet
			isVisible={ props.isVisible }
			onClose={ props.onClose }
			onDismiss={ props.onDismiss }
			testID="link-settings-navigation"
			hideHeader
			hasNavigation
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen
					name={ linkSettingsScreens.settings }
				>
					<LinkSettingsScreen { ...props } withBottomSheet />
				</BottomSheet.NavigationScreen>
				<BottomSheet.NavigationScreen
					name={ linkSettingsScreens.linkPicker }
					isScrollable
					fullScreen
				>
					<LinkPickerScreen
						returnScreenName={ linkSettingsScreens.settings }
					/>
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}

export default memo( LinkSettingsNavigation );
