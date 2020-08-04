/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text, Platform } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft, arrowLeft } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './styles.scss';

function BottomSheetNavigationHeader( { leftButtonOnPress, screen } ) {
	const isIOS = Platform.OS === 'ios';

	const bottomSheetHeaderTitleStyle = usePreferredColorSchemeStyle(
		styles.bottomSheetHeaderTitle,
		styles.bottomSheetHeaderTitleDark
	);
	const bottomSheetButtonTextStyle = usePreferredColorSchemeStyle(
		styles.bottomSheetButtonText,
		styles.bottomSheetButtonTextDark
	);
	const chevronLeftStyle = usePreferredColorSchemeStyle(
		styles.chevronLeftIcon,
		styles.chevronLeftIconDark
	);
	const arrowLeftStyle = usePreferredColorSchemeStyle(
		styles.arrowLeftIcon,
		styles.arrowLeftIconDark
	);

	return (
		<View style={ styles.bottomSheetHeader }>
			<TouchableWithoutFeedback
				onPress={ leftButtonOnPress }
				accessibilityRole={ 'button' }
				accessibilityLabel={ __( 'Go back' ) }
				accessibilityHint={ __(
					'Navigates to the previous content sheet'
				) }
			>
				<View style={ styles.bottomSheetBackButton }>
					{ isIOS ? (
						<>
							<Icon
								icon={ chevronLeft }
								size={ 40 }
								style={ chevronLeftStyle }
							/>
							<Text
								style={ bottomSheetButtonTextStyle }
								maxFontSizeMultiplier={ 2 }
							>
								{ __( 'Back' ) }
							</Text>
						</>
					) : (
						<Icon
							icon={ arrowLeft }
							size={ 24 }
							style={ arrowLeftStyle }
						/>
					) }
				</View>
			</TouchableWithoutFeedback>
			<Text
				style={ bottomSheetHeaderTitleStyle }
				maxFontSizeMultiplier={ 3 }
			>
				{ screen }
			</Text>
			<View style={ styles.bottomSheetRightSpace } />
		</View>
	);
}

export default BottomSheetNavigationHeader;
