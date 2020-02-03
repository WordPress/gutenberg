# ModalHeaderBar

ModalHeaderBar can be used as a toolbar at the top of a modal or a bottom sheet to show the title and possible actions.

## Usage

```jsx
import { ModalHeaderBar } from '@wordpress/components';
import { Button, Modal } from 'react-native';

const MyModal = ( title, onDismiss, ...props ) => {
	const closeButton = (
		<Button
			title="Close"
			onPress={ onDismiss }
		/>
	);
	return (
		<Modal
			onRequestClose={ onDismiss }
			{ ...props }
		>
			<SafeAreaView style={ { flex: 1 } }>
				<ModalHeaderBar
					leftButton={ closeButton }
					title={ title }
				/>
				{ /* Content goes here */ }
			</SafeAreaView>
		</Modal>
	)
}
