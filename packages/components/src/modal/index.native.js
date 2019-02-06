/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
import Modal from 'react-native-modal';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default function CustomModal( props ) {
	const {
		onClose,
		isVisible,
	} = props;

	function fadeAnimation( from, to ) {
		return {
			from: {
				opacity: from,
			},
			to: {
				opacity: to,
			},
		};
	}

	return (
		<Modal
			isVisible={ isVisible }
			animationIn={ fadeAnimation( 0, 1 ) }
			animationOut={ fadeAnimation( 1, 0 ) }
			backdropOpacity={ 0.1 }
			animationInTiming={ 400 }
			animationOutTiming={ 400 }
			backdropTransitionInTiming={ 400 }
			backdropTransitionOutTiming={ 400 }
			onBackdropPress={ onClose }
		>
			<View style={ styles.content } >
				{ props.children }
			</View>
		</Modal>
	);
}
