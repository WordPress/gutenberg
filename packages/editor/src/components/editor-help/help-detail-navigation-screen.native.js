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
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpTopicScreen = ( { content, label } ) => {
	const navigation = useNavigation();

	const {
		listProps: { style: containerStyle, ...scrollViewProps },
	} = useContext( BottomSheetContext );
	const contentContainerStyle = StyleSheet.flatten(
		scrollViewProps.contentContainerStyle
	);
	const separatorStyle = usePreferredColorSchemeStyle(
		styles.separator,
		styles.separatorDark
	);

	return (
		<BottomSheet.NavigationScreen isScrollable fullScreen>
			<View style={ [ containerStyle, styles.container ] }>
				<BottomSheet.NavigationHeader
					screen={ label }
					leftButtonOnPress={ navigation.goBack }
				/>
				<View style={ separatorStyle } />
				<ScrollView
					{ ...scrollViewProps }
					contentContainerStyle={ {
						...contentContainerStyle,
						paddingBottom: Math.max(
							scrollViewProps.safeAreaBottomInset,
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

export default HelpTopicScreen;
