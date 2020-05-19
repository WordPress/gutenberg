/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';
import { requestLinkToExistingContent } from 'react-native-gutenberg-bridge';

export default function ExistingContentPicker( {
	currentUrl = '',
	onOpen,
	onResult,
	onCancel,
	children,
} ) {
	const requestLink = () => {
		onOpen();
		requestLinkToExistingContent( {
			currentUrl,
			callback: ( result ) =>
				result ? onResult( result ) : onCancel(),
		} );
	};
	return (
		<TouchableWithoutFeedback onPress={ requestLink }>
			<View>{ children }</View>
		</TouchableWithoutFeedback>
	);
}
