/**
 * External dependencies
 */
import { View, Text, PanResponder } from 'react-native';
import { useRef } from 'react';

import { PatternPicker } from '@wordpress/react-native-editor/pattern-picker'

function ImageEdit() {
	const panResponder = useRef(PanResponder.create({
		onStartShouldSetPanResponder: (evt, gestureState) => true,
		onMoveShouldSetPanResponder: (evt, gestureState) => true,
		onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
		onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
		onPanResponderTerminationRequest: () => false,
	})).current;

	return (
		// This makes image blocks render with the pattern picker
			// <View pointerEvents="box-none">
			<View {...panResponder.panHandlers}>
				<PatternPicker style={ {
					width: 300,
					height: 700,
				}}/>
				<Text>Hello fragment</Text>
			</View>

	);
}
export {ImageEdit, ImageEdit as default};
