/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { BottomSheet, withSpokenMessages } from '@wordpress/components';

/**
 * Internal dependencies
 */
import screens from './modal-screens/screens';
import LinkSettingsScreen from './modal-screens/link-settings-screen';
import LinkPickerScreen from './modal-screens/link-picker-screen';

const ModalLinkUI = ( { isVisible, ...restProps } ) => {
	return useMemo( () => {
		return (
			<BottomSheet
				isVisible={ isVisible }
				hideHeader
				onClose={ restProps.onClose }
				hasNavigation
			>
				<BottomSheet.NavigationContainer animate main>
					<BottomSheet.NavigationScreen name={ screens.settings }>
						<LinkSettingsScreen
							isVisible={ isVisible }
							{ ...restProps }
						/>
					</BottomSheet.NavigationScreen>
					<BottomSheet.NavigationScreen
						name={ screens.picker }
						isScrollable
						fullScreen
					>
						<LinkPickerScreen />
					</BottomSheet.NavigationScreen>
				</BottomSheet.NavigationContainer>
			</BottomSheet>
		);
	}, [ isVisible ] );
};

export default withSpokenMessages( ModalLinkUI );
