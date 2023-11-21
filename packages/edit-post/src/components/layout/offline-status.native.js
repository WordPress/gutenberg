/**
 * External dependencies
 */
import React, { Text, View, StyleSheet } from 'react-native';

/**
 * WordPress dependencies
 */
import { useNetInfo } from '@react-native-community/netinfo';

const OfflineStatus = () => {
	const { isConnected } = useNetInfo();

	return (
		<View style={ [ styles.container ] }>
			<Text style={ styles.text }>
				{ isConnected ? "You're online" : "You're offline" }
			</Text>
		</View>
	);
};

const styles = StyleSheet.create( {
	container: {
		position: 'absolute',
		top: 15,
		right: 15,
		zIndex: 999,
		backgroundColor: 'black',
		borderRadius: 20,
		padding: 10,
	},
	text: {
		color: 'white',
	},
} );

export default OfflineStatus;
