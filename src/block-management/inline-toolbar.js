/** @flow
 * @format */

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { InlineToolbarButton } from './constants';

import styles from './inline-toolbar.scss';

type PropsType = {
	clientId: string,
	onButtonPressed: ( button: number, clientId: string ) => void,
};

export default class InlineToolbar extends React.Component<PropsType> {
	render() {
		return (
			<View style={ styles.inlineToolbar }>
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind(
						this,
						InlineToolbarButton.PLUS,
						this.props.clientId
					) }
				>
					<View style={ styles.inlineToolbarButton }>
						<Text>+</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind( this, InlineToolbarButton.UP, this.props.clientId ) }
				>
					<View style={ styles.inlineToolbarButton }>
						<Text>▲</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind(
						this,
						InlineToolbarButton.DOWN,
						this.props.clientId
					) }
				>
					<View style={ styles.inlineToolbarButton }>
						<Text>▼</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind(
						this,
						InlineToolbarButton.SETTINGS,
						this.props.clientId
					) }
				>
					<View style={ styles.inlineToolbarButton }>
						{ /* eslint-disable-next-line jsx-a11y/accessible-emoji */ }
						<Text>⚙️</Text>
					</View>
				</TouchableOpacity>
				<View style={ styles.buttonSeparator } />
				<TouchableOpacity
					onPress={ this.props.onButtonPressed.bind(
						this,
						InlineToolbarButton.DELETE,
						this.props.clientId
					) }
				>
					<View style={ styles.inlineToolbarButton }>
						<Text>🗑</Text>
					</View>
				</TouchableOpacity>
			</View>
		);
	}
}
