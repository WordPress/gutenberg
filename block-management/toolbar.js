/** @format */

import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

export default class Toolbar extends React.Component<{ index: number }> {
	constructor( props: { index: number } ) {
		super( props );
	}

	onPressUp() {
		console.log( 'Pressed Up, index: ' + this.props.index );
	}

	onPressDown() {
		console.log( 'Pressed Down, index: ' + this.props.index );
	}

	onPressSettings() {
		console.log( 'Pressed Settings, index: ' + this.props.index );
	}

	onPressDelete() {
		console.log( 'Pressed Delete, index: ' + this.props.index );
	}

	render() {
		return (
			<View style={ styles.toolbar }>
				<Button style={ styles.toolbarButton } onPress={ this.onPressUp.bind( this ) } title="Up" />
				<Button
					style={ styles.toolbarButton }
					onPress={ this.onPressDown.bind( this ) }
					title="Down"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.onPressSettings.bind( this ) }
					title="Settings"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.onPressDelete.bind( this ) }
					title="Delete"
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create( {
	toolbar: {
		height: 34,
		backgroundColor: 'white',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 20,
		paddingRight: 20,
	},
	toolbarButton: {
		padding: 4,
	},
} );
