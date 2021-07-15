/**
 * External dependencies
 */
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { BottomSheet, TextControl, Icon } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpTopicRow = ( { label, icon } ) => {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const openSubSheet = () => {
		setShowSubSheet( true );
		navigation.navigate( BottomSheet.SubSheet.screenName );
	};

	const goBack = () => {
		navigation.goBack();
		setShowSubSheet( false );
	};

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<TextControl
					separatorType="leftMargin"
					customActionButton
					leftAlign
					onPress={ openSubSheet }
					label={ label }
					icon={ icon }
				>
					<Icon icon={ chevronRight } />
				</TextControl>
			}
			showSheet={ showSubSheet }
		>
			<BottomSheet.NavigationHeader
				screen={ label }
				leftButtonOnPress={ goBack }
			/>
			<View style={ styles.separator } />
			<Text>Amanda Todo</Text>
		</BottomSheet.SubSheet>
	);
};

export default HelpTopicRow;
