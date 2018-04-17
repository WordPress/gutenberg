/** @flow
 * @format */

import React from 'react';
import { View, Button } from 'react-native';
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
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.UP, this.props.uid ) }
					title="Up"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DOWN, this.props.uid ) }
					title="Down"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind(
						this,
						ToolbarButton.SETTINGS,
						this.props.uid
					) }
					title="Settings"
				/>
				<Button
					style={ styles.toolbarButton }
					onPress={ this.props.onButtonPressed.bind( this, ToolbarButton.DELETE, this.props.uid ) }
					title="Delete"
				/>
			</View>
		);
	}
}
