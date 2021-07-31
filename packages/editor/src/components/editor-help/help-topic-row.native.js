/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { TextControl, Icon } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

const HelpTopicRow = ( { label, icon } ) => {
	const navigation = useNavigation();

	const openSubSheet = () => {
		navigation.navigate( label );
	};

	return (
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
	);
};

export default HelpTopicRow;
