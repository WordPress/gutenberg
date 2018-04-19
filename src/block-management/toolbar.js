/** @flow
 * @format */

import React from 'react';
import { View, TouchableNativeFeedback, Text } from 'react-native';
import { ToolbarButton } from './constants';

import styles from './toolbar.scss';

type PropsType = {
	uid: string,
	onButtonPressed: ( button: number, uid: string ) => void,
};

export default class Toolbar extends React.Component<PropsType> {
	render() {
		return (
			<View style={ styles.toolbar }>
				<TouchableNativeFeedback
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.PLUS, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>+</Text>
					</View>
				</TouchableNativeFeedback>
				<View style={ styles.buttonSeparator } />
				<TouchableNativeFeedback
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.UP, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>▲</Text>
					</View>
				</TouchableNativeFeedback>
				<View style={ styles.buttonSeparator } />
				<TouchableNativeFeedback
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DOWN, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>▼</Text>
					</View>
				</TouchableNativeFeedback>
				<View style={ styles.buttonSeparator } />
				<TouchableNativeFeedback
					onPress={ this.props.onButtonPressed.bind(
						this,
						ToolbarButton.SETTINGS,
						this.props.uid
					) }
				>
					<View style={ styles.toolbarButton }>
						{ /* eslint-disable-next-line jsx-a11y/accessible-emoji */ }
						<Text>⚙️</Text>
					</View>
				</TouchableNativeFeedback>
				<View style={ styles.buttonSeparator } />
				<TouchableNativeFeedback
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DELETE, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>🗑</Text>
					</View>
				</TouchableNativeFeedback>
			</View>
		);
	}
}
