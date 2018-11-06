/**
 * WordPress dependencies
 */
import React, { Component } from 'react';

/**
 * External dependencies
 */
import { Platform, StyleSheet, Text, View } from 'react-native';

const instructions = Platform.select( {
	ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
	android:
		'Double tap R on your keyboard to reload,\n' +
		'Shake or press menu button for dev menu',
} );

export default class App extends Component {
	render() {
		return (
			<View style={ styles.container }>
				<Text style={ styles.welcome }>Welcome to Gutenberg Mobile!</Text>
				<Text style={ styles.instructions }>To get started, edit packages/mobile/index.js</Text>
				<Text style={ styles.instructions }>{ instructions }</Text>
			</View>
		);
	}
}

const styles = StyleSheet.create( {
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F5FCFF',
	},
	welcome: {
		fontSize: 25,
		textAlign: 'center',
		margin: 10,
	},
	instructions: {
		textAlign: 'center',
		color: '#333333',
		marginBottom: 5,
	},
} );
