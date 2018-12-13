
import React from 'react';
import { View, Text } from 'react-native';
import Modal from 'react-native-modal';
import { URLInput } from '@wordpress/editor';

import styles from './modal.scss';

export default ( { value, isVisible, onClose, ...customProps } ) => {
	return (
		<Modal
			isVisible={ isVisible }
			style={ styles.bottomModal }
			animationInTiming={ 500 }
			animationOutTiming={ 500 }
			backdropTransitionInTiming={ 500 }
			backdropTransitionOutTiming={ 500 }
			onBackdropPress={ onClose }
			onSwipe={ onClose }
			swipeDirection="down"
			{ ...customProps }
		>
			<View style={ { ...styles.content, borderColor: 'rgba(0, 0, 0, 0.1)' } }>
				<URLInput value={ 'https://wp.com' } />
				<Text>{ value.text }</Text>
			</View>
		</Modal>
	);
};
