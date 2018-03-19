/** @format */

import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

export default class Toolbar extends React.Component<{
	index: number,
	onButtonPressed: ( button: string, index: number ) => void,
}> {
	constructor( props: {
		index: number,
		onButtonPressed: ( button: string, index: number ) => void,
	} ) {
		super( props );
	}

	onPressUp() {
		this.props.onButtonPressed( 'up', this.props.index );
	}

	onPressDown() {
		this.props.onButtonPressed( 'down', this.props.index );
	}

	onPressSettings() {
		this.props.onButtonPressed( 'setting', this.props.index );
	}

	onPressDelete() {
		this.props.onButtonPressed( 'delete', this.props.index );
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
