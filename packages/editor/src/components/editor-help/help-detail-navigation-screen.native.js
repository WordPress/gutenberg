/**
 * External dependencies
 */
import {
	ScrollView,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { BottomSheet, BottomSheetContext } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpDetailNavigationScreen = ( { content, label } ) => {
	const navigation = useNavigation();

	const { listProps } = useContext( BottomSheetContext );
	const contentContainerStyle = StyleSheet.flatten(
		listProps.contentContainerStyle
	);

	return (
		<BottomSheet.NavigationScreen isScrollable fullScreen>
			<View style={ styles.container }>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton
						onPress={ navigation.goBack }
					/>
					<BottomSheet.NavBar.Heading>
						{ label }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<ScrollView
					{ ...listProps }
					contentContainerStyle={ {
						...contentContainerStyle,
						paddingBottom: Math.max(
							listProps.safeAreaBottomInset,
							contentContainerStyle.paddingBottom
						),
						/**
						 * Remove margin set via `hideHeader`. Combining a header
						 * and navigation in this bottom sheet is at odds with the
						 * current `BottomSheet` implementation.
						 */
						marginTop: 0,
					} }
				>
					<TouchableWithoutFeedback accessible={ false }>
						<View>{ content }</View>
					</TouchableWithoutFeedback>
				</ScrollView>
			</View>
		</BottomSheet.NavigationScreen>
	);
};

export default HelpDetailNavigationScreen;
