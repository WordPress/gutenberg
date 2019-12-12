import { View, Text } from 'react-native';

import { BottomSheet } from '@wordpress/components';

const Preview = ( props ) => {
	const { content, onDismiss } = props;
	return (
		<BottomSheet
			isVisible={ !! content }
			onClose={ onDismiss }
		>
			<View>
				<Text>{ content }</Text>
			</View>
		</BottomSheet>
	);
}

export default Preview;
