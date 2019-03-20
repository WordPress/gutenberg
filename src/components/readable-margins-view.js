/**
 * @format
 * @flow
 */

import * as React from 'react';
import { View } from 'react-native';

type PropsType = {
	children?: React.Node,
};

type StateType = {

};

export default class ReadableMarginsView extends React.Component<PropsType, StateType> {
	render() {
		const { children } = this.props;

		return (
			// <View style={{flex: 1, alignContent: "center"}}>
				<View style={ {marginLeft: 200, marginRight: 200} }>
					{ children }
				</View>
			// </View>
		);
	}
}