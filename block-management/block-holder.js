/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';

export default class BlockHolder extends React.Component<
	{ index: number, blockType: string, content: string },
	{ selected: boolean, focused: boolean }
> {
	state = {
		selected: false,
		focused: true,
	};
	constructor( props: { index: number, blockType: string, content: string } ) {
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

	renderToolbar() {
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

	renderToolbarIfBlockFocused() {
		if ( this.state.focused ) {
			return this.renderToolbar();
		} else {
			// Return empty view, toolbar won't be rendered
			return <View />;
		}
	}

	render() {
		// TODO: This is a place holder, this should call the edit() method of the block depending on this.props.blockType
		return (
			<View style={ styles.blockHolder }>
				<View style={ styles.blockTitle }>
					<Text>BlockType: { this.props.blockType }</Text>
				</View>
				<View style={ styles.blockContent }>
					<Text>{ this.props.content }</Text>
				</View>
				{ this.renderToolbarIfBlockFocused.bind( this )() }
			</View>
		);
	}
}

const styles = StyleSheet.create( {
	blockHolder: {
		flex: 1,
	},
	blockContent: {
		backgroundColor: 'white',
		padding: 10,
	},
	blockTitle: {
		backgroundColor: 'grey',
		paddingLeft: 10,
		paddingTop: 4,
		paddingBottom: 4,
	},
	toolbar: {
		height: 34,
		backgroundColor: 'white',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 20,
		paddingRight: 20,
	},
	toolbarButton: {
		marginRight: 20,
	},
} );
