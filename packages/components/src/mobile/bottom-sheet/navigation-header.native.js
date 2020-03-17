/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text, Platform } from 'react-native';
/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronLeft, arrowLeft } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './styles.scss';

function BottomSheetNavigationHeader( { leftButtonOnPress, screen } ) {
	const isIOS = Platform.OS === 'ios';

	return (
		<View style={ styles.bottomSheetHeader }>
			<TouchableWithoutFeedback onPress={ leftButtonOnPress }>
				<View style={ styles.bottomSheetBackButton }>
					{ isIOS ? (
						<>
							<Icon
								icon={ chevronLeft }
								size={ 40 }
								style={ styles.bottomSheetBackButtonIcon }
							/>
							<Text style={ styles.bottomSheetBackButtonText }>
								{ __( 'Back' ) }
							</Text>
						</>
					) : (
						<Icon icon={ arrowLeft } size={ 24 } />
					) }
				</View>
			</TouchableWithoutFeedback>
			<Text style={ [ styles.bottomSheetHeaderTitle ] }>
				{ sprintf( __( '%s' ), screen ) }
			</Text>
			<View style={ styles.bottomSheetRightSpace } />
		</View>
	);
}

export default BottomSheetNavigationHeader;
