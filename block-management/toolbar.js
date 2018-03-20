/** @format */

import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { ToolbarButton } from './constants';

export default class Toolbar extends React.Component<{
	index: number,
	onButtonPressed: ( button: number, index: number ) => void,
}> {
	constructor( props: {
		index: number,
		onButtonPressed: ( button: number, index: number ) => void,
	} ) {
		super( props );
	}

	render() {
		return (
			<View style={ styles.toolbar }>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.UP, this.props.index ) }
					title="Up"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DOWN, this.props.index ) }
					title="Down"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind(
						this,
						ToolbarButton.SETTINGS,
						this.props.index
					) }
					title="Settings"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind(
						this,
						ToolbarButton.DELETE,
						this.props.index
					) }
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
