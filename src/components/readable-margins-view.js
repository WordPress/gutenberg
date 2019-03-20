/**
 * @format
 * @flow
 */

import * as React from 'react';
import { View } from 'react-native';
import styles from './readable-margins-view.scss';

type PropsType = {
	children?: React.Node,
};

type StateType = {

};

export default class ReadableMarginsView extends React.Component<PropsType, StateType> {
	render() {
		const { children } = this.props;

		return (
			<View style={ styles.container } >
				<View style={ styles.centeredContent } >
					{ children }
				</View>
			</View>
		);
	}
}
