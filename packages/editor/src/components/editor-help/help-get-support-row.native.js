/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { TextControl, Icon } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';
import { requestCustomerSupportOptionsShow } from '@wordpress/react-native-bridge';

const HelpGetSupportRow = ( { label, icon } ) => {
	return (
		<TextControl
			separatorType="leftMargin"
			customActionButton
			leftAlign
			onPress={ requestCustomerSupportOptionsShow() }
			label={ label }
			icon={ icon }
		>
			<Icon icon={ chevronRight } />
		</TextControl>
	);
};

export default HelpGetSupportRow;
