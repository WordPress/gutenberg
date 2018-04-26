/** @flow
 * @format */

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ToolbarButton } from './constants';

import styles from './toolbar-style.scss';

type PropsType = {
	uid: string,
	onButtonPressed: ( button: number, uid: string ) => void,
};

export default class Toolbar extends React.Component<PropsType> {
	render() {
		return (
			<View style={ styles.toolbar }>
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.PLUS, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>+</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.UP, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>▲</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DOWN, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>▼</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
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
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DELETE, this.props.uid ) }
				>
					<View style={ styles.toolbarButton }>
						<Text>🗑</Text>
					</View>
				</TouchableOpacity>
			</View>
		);
	}
}
