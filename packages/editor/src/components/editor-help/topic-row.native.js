/**
 * WordPress dependencies
 */
import { TextControl, Icon } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

function TopicRow( { onPress, label, icon } ) {
	return (
		<TextControl
			separatorType="leftMargin"
			customActionButton
			leftAlign
			onPress={ onPress }
			label={ label }
			icon={ icon }
		>
			<Icon icon={ chevronRight } />
		</TextControl>
	);
}

export default TopicRow;
